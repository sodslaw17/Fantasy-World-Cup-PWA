"use server";

import { generateCommentary } from "@/lib/llm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/auth/roles";
import { computeOverallLeaderboard } from "@/lib/scoring/overall";
import {
  computeEfficiencyLeaderboard,
  computeDisciplineLeaderboard,
  computeCardPoints,
} from "@/lib/scoring/sidepots";
import { type KnockoutMatch, type KnockoutStage } from "@/lib/scoring/knockout";
import {
  buildUserMatchContext,
  buildPreGamePrompt,
  buildPostGamePrompt,
  buildSystemPrompt,
  type CommentaryType,
  type MatchContext,
  type SassLevel,
} from "@/lib/commentary";

export type CommentaryActionResult = { error?: string; generated?: number };

// ─── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? "")) throw new Error("Unauthorized");
}

// ─── Shared data fetch ─────────────────────────────────────────────────────────

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
    { data: allMatchStats },
    { data: nicknames },
    { data: commentaryConfig },
  ] = await Promise.all([
    service.from("profiles").select("id, auth_id, display_name"),
    service.from("drafts").select("profile_id, teams(fifa_code)"),
    service.from("matches").select("*").neq("stage", "group"),
    service.from("penalty_events").select("match_id, team_code, type"),
    service.from("efficiency_picks").select("profile_id, player_name, team_code, goals, assists, minutes"),
    service.from("matches").select("id, home_goals, away_goals, status").eq("stage", "group"),
    service.from("predictions").select("user_id, match_id, home_goals_pred, away_goals_pred"),
    service.from("teams").select("fifa_code, name"),
    service.from("match_stats").select("match_id, team_code, yellows, second_yellows, straight_reds"),
    service.from("pool_nicknames").select("profile_id, team_code, nickname"),
    service.from("commentary_config").select("sass_level").maybeSingle(),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name]),
  );

  const profileById: Record<string, string> = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.display_name]),
  );

  const drafts = (rawDrafts ?? [])
    .map((d) => {
      const t = Array.isArray(d.teams) ? d.teams[0] : d.teams;
      return {
        profile_id: d.profile_id as string,
        team_code: (t as { fifa_code?: string } | null)?.fifa_code ?? "",
      };
    })
    .filter((d) => d.team_code);

  const draftsByTeam: Record<string, { profileId: string; displayName: string }> = {};
  for (const d of drafts) {
    const name = profileById[d.profile_id];
    if (name) draftsByTeam[d.team_code] = { profileId: d.profile_id, displayName: name };
  }

  const koMatches = (allKOMatches ?? []) as KnockoutMatch[];

  const standings = computeOverallLeaderboard(
    (profiles ?? []) as { id: string; auth_id: string | null; display_name: string }[],
    (groupMatches ?? []) as { id: string; home_goals: number | null; away_goals: number | null; status: string }[],
    (groupPreds ?? []) as { user_id: string; match_id: string; home_goals_pred: number; away_goals_pred: number }[],
    drafts,
    koMatches,
    (penaltyEvents ?? []) as { match_id: string; team_code: string; type: "off_target" | "panenka_fail" | "panenka_score" }[],
  );

  // Efficiency leaderboard (only picks with a team_code)
  const effInputs = (allEffPicks ?? [])
    .filter((ep) => ep.team_code)
    .map((ep) => ({
      profileId: ep.profile_id as string,
      displayName: profileById[ep.profile_id as string] ?? "Unknown",
      playerName: ep.player_name as string,
      teamCode: ep.team_code as string,
      goals: (ep.goals as number) ?? 0,
      assists: (ep.assists as number) ?? 0,
      minutes: (ep.minutes as number) ?? 0,
    }));
  const rawEffBoard = computeEfficiencyLeaderboard(effInputs);
  const effLeader = rawEffBoard[0];
  const effBoard = rawEffBoard.map((e) => ({
    ...e,
    gapToLeader: e.rank === 1 ? null : Math.round((effLeader.efficiency - e.efficiency) * 10000) / 10000,
    leaderName: e.rank === 1 ? null : (effLeader.displayName as string),
  }));
  const effByTeam: Record<string, (typeof effBoard)[number]> = {};
  for (const e of effBoard) {
    if (e.teamCode) effByTeam[e.teamCode] = e;
  }

  // Discipline leaderboard
  const discLeaderboard = computeDisciplineLeaderboard(
    (profiles ?? []) as { id: string; display_name: string; auth_id: string | null }[],
    drafts,
    (allMatchStats ?? []) as { team_code: string; yellows: number; second_yellows: number; straight_reds: number }[],
  );
  const discByProfile: Record<string, (typeof discLeaderboard)[number]> = {};
  for (const d of discLeaderboard) discByProfile[d.profileId] = d;

  // Nicknames: profileId → { user, teams }
  const nicknameMap: Record<string, { user: string | null; teams: Record<string, string> }> = {};
  for (const n of nicknames ?? []) {
    const pid = n.profile_id as string;
    const code = (n.team_code as string) ?? "";
    if (!nicknameMap[pid]) nicknameMap[pid] = { user: null, teams: {} };
    if (code === "") nicknameMap[pid].user = n.nickname as string;
    else nicknameMap[pid].teams[code] = n.nickname as string;
  }

  const sassLevel = ((commentaryConfig?.sass_level as SassLevel | null) ?? "medium") as SassLevel;

  return {
    teamNames, draftsByTeam, standings, koMatches,
    effByTeam, discLeaderboard, discByProfile,
    nicknameMap, sassLevel,
    allMatchStats: (allMatchStats ?? []) as {
      match_id: string; team_code: string;
      yellows: number; second_yellows: number; straight_reds: number;
    }[],
  };
}

// ─── Build MatchContext ────────────────────────────────────────────────────────

type RawMatch = {
  id: string; stage: string;
  home_team_code: string | null; away_team_code: string | null;
  kickoff_utc: string;
  home_goals: number | null; away_goals: number | null;
  went_to_shootout: boolean; shootout_winner: string | null;
  status: string;
};

function buildMatchContext(
  match: RawMatch,
  shared: Awaited<ReturnType<typeof fetchSharedData>>,
  matchCardStats?: { team_code: string; yellows: number; second_yellows: number; straight_reds: number }[],
): MatchContext {
  const { teamNames, draftsByTeam, standings, effByTeam, discLeaderboard, discByProfile, nicknameMap, sassLevel } = shared;

  const homeCode = match.home_team_code;
  const awayCode = match.away_team_code;

  let finishedMatch: KnockoutMatch | null = null;
  if (match.status === "finished" && match.home_goals !== null && match.away_goals !== null) {
    finishedMatch = {
      id: match.id,
      stage: match.stage as KnockoutStage,
      home_team_code: homeCode,
      away_team_code: awayCode,
      home_goals: match.home_goals,
      away_goals: match.away_goals,
      went_to_shootout: match.went_to_shootout,
      shootout_winner: match.shootout_winner as "home" | "away" | null,
      status: match.status,
    };
  }

  const users: MatchContext["users"] = [];

  for (const [side, code] of [["home", homeCode], ["away", awayCode]] as const) {
    if (!code) continue;
    const drafter = draftsByTeam[code];
    if (!drafter) continue;

    const nickEntry = nicknameMap[drafter.profileId];

    users.push(
      buildUserMatchContext({
        profileId: drafter.profileId,
        displayName: drafter.displayName,
        nickname: nickEntry?.user ?? null,
        teamCode: code,
        teamName: teamNames[code] ?? code,
        teamNickname: nickEntry?.teams[code] ?? null,
        side: side as "home" | "away",
        stage: match.stage,
        standings,
        effEntry: effByTeam[code] ?? null,
        discEntry: discByProfile[drafter.profileId] ?? null,
        discLeaderboard,
        finishedMatch,
      }),
    );
  }

  // Result (post-game)
  let result: MatchContext["result"] | undefined;
  if (finishedMatch && matchCardStats) {
    const hS = matchCardStats.find((s) => s.team_code === homeCode);
    const aS = matchCardStats.find((s) => s.team_code === awayCode);
    result = {
      homeGoals: finishedMatch.home_goals,
      awayGoals: finishedMatch.away_goals,
      wentToShootout: finishedMatch.went_to_shootout,
      penWinner: finishedMatch.shootout_winner,
      homeCardPts: hS ? computeCardPoints(hS.yellows, hS.second_yellows, hS.straight_reds) : 0,
      awayCardPts: aS ? computeCardPoints(aS.yellows, aS.second_yellows, aS.straight_reds) : 0,
      homeYellows: hS?.yellows ?? 0,
      homeRedCards: (hS?.second_yellows ?? 0) + (hS?.straight_reds ?? 0),
      awayYellows: aS?.yellows ?? 0,
      awayRedCards: (aS?.second_yellows ?? 0) + (aS?.straight_reds ?? 0),
    };
  }

  return {
    matchId: match.id,
    homeTeamName: teamNames[homeCode ?? ""] ?? homeCode ?? "TBD",
    awayTeamName: teamNames[awayCode ?? ""] ?? awayCode ?? "TBD",
    stage: match.stage,
    kickoffUtc: match.kickoff_utc,
    sassLevel,
    users,
    allStandings: standings.map((s) => ({
      rank: s.rank,
      displayName: s.displayName,
      nickname: nicknameMap[s.profileId]?.user ?? null,
      totalPoints: s.totalPoints,
    })),
    result,
  };
}

// ─── Pre-game ──────────────────────────────────────────────────────────────────

export async function generatePreGame(matchId: string): Promise<CommentaryActionResult> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const shared = await fetchSharedData();
    const { data: match } = await service.from("matches").select("*").eq("id", matchId).single();
    if (!match) return { error: "Match not found" };

    const ctx = buildMatchContext(match as RawMatch, shared);
    const text = await generateCommentary(buildSystemPrompt(shared.sassLevel), buildPreGamePrompt(ctx));

    await service.from("match_commentary").upsert(
      { match_id: matchId, pregame_text: text, pregame_status: "generated", pregame_generated_at: new Date().toISOString() },
      { onConflict: "match_id" },
    );
    revalidatePath("/today");
    return { generated: 1 };
  } catch (err) {
    console.error("generatePreGame:", err);
    return { error: err instanceof Error ? err.message : "Generation failed" };
  }
}

// ─── Post-game ─────────────────────────────────────────────────────────────────

export async function generatePostGame(matchId: string): Promise<CommentaryActionResult> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const shared = await fetchSharedData();
    const { data: match } = await service.from("matches").select("*").eq("id", matchId).single();
    if (!match) return { error: "Match not found" };
    if (match.status !== "finished") return { error: "Match not finished yet" };
    if (match.home_goals === null || match.away_goals === null) return { error: "Goals not entered" };

    const { data: matchStats } = await service
      .from("match_stats")
      .select("team_code, yellows, second_yellows, straight_reds")
      .eq("match_id", matchId);

    const ctx = buildMatchContext(
      match as RawMatch,
      shared,
      (matchStats ?? []) as { team_code: string; yellows: number; second_yellows: number; straight_reds: number }[],
    );

    const text = await generateCommentary(buildSystemPrompt(shared.sassLevel), buildPostGamePrompt(ctx));

    await service.from("match_commentary").upsert(
      { match_id: matchId, postgame_text: text, postgame_status: "generated", postgame_generated_at: new Date().toISOString() },
      { onConflict: "match_id" },
    );
    revalidatePath("/today");
    return { generated: 1 };
  } catch (err) {
    console.error("generatePostGame:", err);
    return { error: err instanceof Error ? err.message : "Generation failed" };
  }
}

// ─── Bulk generate ─────────────────────────────────────────────────────────────

export async function generateAllPendingRecaps(matchIds: string[]): Promise<CommentaryActionResult> {
  if (matchIds.length === 0) return { generated: 0 };
  try {
    await requireAdmin();
    const service = createServiceClient();
    const shared = await fetchSharedData();

    let generated = 0;
    const errors: string[] = [];

    for (const matchId of matchIds) {
      try {
        const { data: match } = await service.from("matches").select("*").eq("id", matchId).single();
        if (!match || match.status !== "finished" || match.home_goals === null || match.away_goals === null) continue;

        const { data: matchStats } = await service
          .from("match_stats")
          .select("team_code, yellows, second_yellows, straight_reds")
          .eq("match_id", matchId);

        const ctx = buildMatchContext(
          match as RawMatch,
          shared,
          (matchStats ?? []) as { team_code: string; yellows: number; second_yellows: number; straight_reds: number }[],
        );

        const text = await generateCommentary(buildSystemPrompt(shared.sassLevel), buildPostGamePrompt(ctx));

        await service.from("match_commentary").upsert(
          { match_id: matchId, postgame_text: text, postgame_status: "generated", postgame_generated_at: new Date().toISOString() },
          { onConflict: "match_id" },
        );
        generated++;
      } catch (err) {
        errors.push(`${matchId}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    revalidatePath("/today");
    return { generated, error: errors.length > 0 ? `${errors.length} failed: ${errors.join("; ")}` : undefined };
  } catch (err) {
    console.error("generateAllPendingRecaps:", err);
    return { error: err instanceof Error ? err.message : "Generation failed" };
  }
}

// ─── Sass level ────────────────────────────────────────────────────────────────

export async function setSassLevel(level: SassLevel): Promise<CommentaryActionResult> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    await service.from("commentary_config").upsert(
      { singleton: true, sass_level: level, updated_at: new Date().toISOString() },
      { onConflict: "singleton" },
    );
    revalidatePath("/today");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Save failed" };
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
      { match_id: matchId, [`${field}_text`]: text.trim(), [`${field}_status`]: "edited" },
      { onConflict: "match_id" },
    );
    revalidatePath("/today");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Save failed" };
  }
}

// ─── Clear ─────────────────────────────────────────────────────────────────────

export async function clearCommentary(
  matchId: string,
  type: CommentaryType,
): Promise<CommentaryActionResult> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const field = type === "pregame" ? "pregame" : "postgame";
    await service.from("match_commentary").upsert(
      { match_id: matchId, [`${field}_text`]: null, [`${field}_status`]: "none", [`${field}_generated_at`]: null },
      { onConflict: "match_id" },
    );
    revalidatePath("/today");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Clear failed" };
  }
}
