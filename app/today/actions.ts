"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/auth/roles";
import { computeOverallLeaderboard } from "@/lib/scoring/overall";
import { type KnockoutMatch, type KnockoutStage } from "@/lib/scoring/knockout";
import {
  buildInvolvement,
  buildEffPicksInGame,
  buildPreGamePrompt,
  buildPostGamePrompt,
  SYSTEM_PROMPT,
  type CommentaryType,
} from "@/lib/commentary";

export type CommentaryActionResult = { error?: string; generated?: number };

// ─── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? "")) {
    throw new Error("Unauthorized");
  }
}

// ─── Shared data fetch ─────────────────────────────────────────────────────────
// Fetches all data needed to build a commentary prompt. Called once per action,
// then reused across multiple match generations (e.g., "generate all").

async function fetchSharedData() {
  const service = createServiceClient();

  const [
    { data: profiles },
    { data: rawDrafts },
    { data: allKOMatches },
    { data: penaltyEvents },
    { data: allEffPicks },
    { data: groupMatches },
    { data: groupPreds },
    { data: teams },
  ] = await Promise.all([
    service.from("profiles").select("id, auth_id, display_name"),
    service.from("drafts").select("profile_id, teams(fifa_code)"),
    service.from("matches").select("*").neq("stage", "group"),
    service.from("penalty_events").select("match_id, team_code, type"),
    service.from("efficiency_picks").select("profile_id, player_name, team_code"),
    service
      .from("matches")
      .select("id, home_goals, away_goals, status")
      .eq("stage", "group"),
    service
      .from("predictions")
      .select("user_id, match_id, home_goals_pred, away_goals_pred"),
    service.from("teams").select("fifa_code, name"),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name]),
  );

  const profileById: Record<string, string> = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.display_name]),
  );

  // Normalize drafts: { profile_id, team_code }
  const drafts = (rawDrafts ?? [])
    .map((d) => {
      const t = Array.isArray(d.teams) ? d.teams[0] : d.teams;
      return {
        profile_id: d.profile_id as string,
        team_code: (t as { fifa_code?: string } | null)?.fifa_code ?? "",
      };
    })
    .filter((d) => d.team_code);

  // draftsByTeam: teamCode → { profileId, displayName }
  const draftsByTeam: Record<string, { profileId: string; displayName: string }> = {};
  for (const d of drafts) {
    const name = profileById[d.profile_id];
    if (name) draftsByTeam[d.team_code] = { profileId: d.profile_id, displayName: name };
  }

  const koMatches = (allKOMatches ?? []) as KnockoutMatch[];

  // Compute standings using ALL current data (reflects any just-entered results)
  const standings = computeOverallLeaderboard(
    (profiles ?? []) as { id: string; auth_id: string | null; display_name: string }[],
    (groupMatches ?? []) as {
      id: string;
      home_goals: number | null;
      away_goals: number | null;
      status: string;
    }[],
    (groupPreds ?? []) as {
      user_id: string;
      match_id: string;
      home_goals_pred: number;
      away_goals_pred: number;
    }[],
    drafts,
    koMatches,
    (penaltyEvents ?? []) as { match_id: string; team_code: string; type: "off_target" | "panenka_fail" | "panenka_score" }[],
  );

  const effPicks = (allEffPicks ?? []).map((ep) => ({
    profileId: ep.profile_id as string,
    displayName: profileById[ep.profile_id as string] ?? "Unknown",
    playerName: ep.player_name as string,
    teamCode: ep.team_code as string | null,
  }));

  return { teamNames, draftsByTeam, standings, effPicks, koMatches };
}

// ─── Claude caller ─────────────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text.trim();
}

// ─── Pre-game generation ───────────────────────────────────────────────────────

export async function generatePreGame(matchId: string): Promise<CommentaryActionResult> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const { teamNames, draftsByTeam, standings, effPicks } = await fetchSharedData();

    const { data: match } = await service
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();
    if (!match) return { error: "Match not found" };

    const involvement = buildInvolvement(
      match.home_team_code,
      match.away_team_code,
      match.stage,
      null, // pre-game: no scoring yet
      draftsByTeam,
      standings,
      teamNames,
    );
    const effPicksInGame = buildEffPicksInGame(
      match.home_team_code,
      match.away_team_code,
      effPicks,
      teamNames,
    );

    const homeTeamName = teamNames[match.home_team_code ?? ""] ?? match.home_team_code ?? "TBD";
    const awayTeamName = teamNames[match.away_team_code ?? ""] ?? match.away_team_code ?? "TBD";

    const prompt = buildPreGamePrompt(
      homeTeamName,
      awayTeamName,
      match.stage,
      match.kickoff_utc,
      involvement,
      effPicksInGame,
      standings,
    );

    const text = await callClaude(prompt);

    await service.from("match_commentary").upsert(
      {
        match_id: matchId,
        pregame_text: text,
        pregame_status: "generated",
        pregame_generated_at: new Date().toISOString(),
      },
      { onConflict: "match_id" },
    );

    revalidatePath("/today");
    return { generated: 1 };
  } catch (err) {
    console.error("generatePreGame:", err);
    return { error: err instanceof Error ? err.message : "Generation failed" };
  }
}

// ─── Post-game generation ──────────────────────────────────────────────────────

export async function generatePostGame(matchId: string): Promise<CommentaryActionResult> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const { teamNames, draftsByTeam, standings, effPicks, koMatches } =
      await fetchSharedData();

    const { data: match } = await service
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();
    if (!match) return { error: "Match not found" };
    if (match.status !== "finished") return { error: "Match is not finished yet" };
    if (match.home_goals === null || match.away_goals === null) {
      return { error: "Match goals not entered yet" };
    }

    // Fetch card stats for this match
    const { data: matchStats } = await service
      .from("match_stats")
      .select("team_code, yellows, second_yellows, straight_reds")
      .eq("match_id", matchId);

    const cardStats = (matchStats ?? []).map((ms) => ({
      teamCode: ms.team_code as string,
      teamName: teamNames[ms.team_code as string] ?? (ms.team_code as string),
      yellows: (ms.yellows as number) ?? 0,
      secondYellows: (ms.second_yellows as number) ?? 0,
      straightReds: (ms.straight_reds as number) ?? 0,
    }));

    // Cast to KnockoutMatch for scoring — goals are confirmed non-null above
    const km: KnockoutMatch = {
      id: match.id,
      stage: match.stage as KnockoutStage,
      home_team_code: match.home_team_code,
      away_team_code: match.away_team_code,
      home_goals: match.home_goals,
      away_goals: match.away_goals,
      went_to_shootout: match.went_to_shootout,
      shootout_winner: match.shootout_winner as "home" | "away" | null,
      status: match.status,
    };

    const involvement = buildInvolvement(
      match.home_team_code,
      match.away_team_code,
      match.stage,
      km,
      draftsByTeam,
      standings,
      teamNames,
    );
    const effPicksInGame = buildEffPicksInGame(
      match.home_team_code,
      match.away_team_code,
      effPicks,
      teamNames,
    );

    const homeTeamName = teamNames[match.home_team_code ?? ""] ?? match.home_team_code ?? "TBD";
    const awayTeamName = teamNames[match.away_team_code ?? ""] ?? match.away_team_code ?? "TBD";

    const prompt = buildPostGamePrompt(
      homeTeamName,
      awayTeamName,
      match.stage,
      match.home_goals,
      match.away_goals,
      match.went_to_shootout,
      match.shootout_winner,
      involvement,
      effPicksInGame,
      standings,
      cardStats,
    );

    const text = await callClaude(prompt);

    await service.from("match_commentary").upsert(
      {
        match_id: matchId,
        postgame_text: text,
        postgame_status: "generated",
        postgame_generated_at: new Date().toISOString(),
      },
      { onConflict: "match_id" },
    );

    revalidatePath("/today");
    return { generated: 1 };
  } catch (err) {
    console.error("generatePostGame:", err);
    return { error: err instanceof Error ? err.message : "Generation failed" };
  }
}

// ─── Generate all pending post-game recaps ─────────────────────────────────────
// Client passes IDs of today's finished knockout matches without a post-game recap.

export async function generateAllPendingRecaps(
  matchIds: string[],
): Promise<CommentaryActionResult> {
  if (matchIds.length === 0) return { generated: 0 };
  try {
    await requireAdmin();
    const service = createServiceClient();
    const { teamNames, draftsByTeam, standings, effPicks } = await fetchSharedData();

    let generated = 0;
    const errors: string[] = [];

    for (const matchId of matchIds) {
      try {
        const { data: match } = await service
          .from("matches")
          .select("*")
          .eq("id", matchId)
          .single();
        if (!match || match.status !== "finished" || match.home_goals === null || match.away_goals === null) continue;

        const { data: matchStats } = await service
          .from("match_stats")
          .select("team_code, yellows, second_yellows, straight_reds")
          .eq("match_id", matchId);

        const cardStats = (matchStats ?? []).map((ms) => ({
          teamCode: ms.team_code as string,
          teamName: teamNames[ms.team_code as string] ?? (ms.team_code as string),
          yellows: (ms.yellows as number) ?? 0,
          secondYellows: (ms.second_yellows as number) ?? 0,
          straightReds: (ms.straight_reds as number) ?? 0,
        }));

        const km: KnockoutMatch = {
          id: match.id,
          stage: match.stage as KnockoutStage,
          home_team_code: match.home_team_code,
          away_team_code: match.away_team_code,
          home_goals: match.home_goals,
          away_goals: match.away_goals,
          went_to_shootout: match.went_to_shootout,
          shootout_winner: match.shootout_winner as "home" | "away" | null,
          status: match.status,
        };

        const involvement = buildInvolvement(
          match.home_team_code, match.away_team_code, match.stage,
          km, draftsByTeam, standings, teamNames,
        );
        const effPicksInGame = buildEffPicksInGame(
          match.home_team_code, match.away_team_code, effPicks, teamNames,
        );

        const homeTeamName = teamNames[match.home_team_code ?? ""] ?? "TBD";
        const awayTeamName = teamNames[match.away_team_code ?? ""] ?? "TBD";

        const prompt = buildPostGamePrompt(
          homeTeamName, awayTeamName, match.stage,
          match.home_goals, match.away_goals,
          match.went_to_shootout, match.shootout_winner,
          involvement, effPicksInGame, standings, cardStats,
        );

        const text = await callClaude(prompt);

        await service.from("match_commentary").upsert(
          {
            match_id: matchId,
            postgame_text: text,
            postgame_status: "generated",
            postgame_generated_at: new Date().toISOString(),
          },
          { onConflict: "match_id" },
        );
        generated++;
      } catch (err) {
        errors.push(`${matchId}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    revalidatePath("/today");
    return {
      generated,
      error: errors.length > 0 ? `${errors.length} failed: ${errors.join("; ")}` : undefined,
    };
  } catch (err) {
    console.error("generateAllPendingRecaps:", err);
    return { error: err instanceof Error ? err.message : "Generation failed" };
  }
}

// ─── Manual edit ───────────────────────────────────────────────────────────────

export async function saveCommentaryEdit(
  matchId: string,
  type: CommentaryType,
  text: string,
): Promise<CommentaryActionResult> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const field = type === "pregame" ? "pregame" : "postgame";
    await service.from("match_commentary").upsert(
      {
        match_id: matchId,
        [`${field}_text`]: text.trim(),
        [`${field}_status`]: "edited",
      },
      { onConflict: "match_id" },
    );
    revalidatePath("/today");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Save failed" };
  }
}

// ─── Clear / hide ──────────────────────────────────────────────────────────────

export async function clearCommentary(
  matchId: string,
  type: CommentaryType,
): Promise<CommentaryActionResult> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const field = type === "pregame" ? "pregame" : "postgame";
    await service.from("match_commentary").upsert(
      {
        match_id: matchId,
        [`${field}_text`]: null,
        [`${field}_status`]: "none",
        [`${field}_generated_at`]: null,
      },
      { onConflict: "match_id" },
    );
    revalidatePath("/today");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Clear failed" };
  }
}
