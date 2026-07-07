"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

interface ActionResult {
  success?: boolean;
  error?: string;
}

/** Save a match result and auto-populate match_stats for both teams. */
export async function saveMatchResult(formData: FormData): Promise<ActionResult> {
  const matchId        = formData.get("match_id") as string;
  const homeGoals      = parseInt(formData.get("home_goals") as string);
  const awayGoals      = parseInt(formData.get("away_goals") as string);
  const wentToET       = formData.getAll("went_to_et").includes("true");
  const wentToShootout = formData.getAll("went_to_shootout").includes("true");
  const shootoutWinner = (formData.get("shootout_winner") as string) || null;

  if (isNaN(homeGoals) || isNaN(awayGoals) || homeGoals < 0 || awayGoals < 0) {
    return { error: "Goals must be non-negative numbers." };
  }
  if (wentToShootout && !shootoutWinner) {
    return { error: "Select a shootout winner." };
  }
  if (wentToShootout && homeGoals !== awayGoals) {
    return { error: "Shootout requires a drawn score after 90+ET." };
  }

  const service = createServiceClient();

  // Update match
  const { error: matchErr } = await service
    .from("matches")
    .update({
      home_goals: homeGoals,
      home_goals_manual: homeGoals,
      away_goals: awayGoals,
      away_goals_manual: awayGoals,
      went_to_et: wentToET,
      went_to_shootout: wentToShootout,
      shootout_winner: wentToShootout ? shootoutWinner : null,
      status: "finished",
      status_manual: "finished",
    })
    .eq("id", matchId);

  if (matchErr) return { error: matchErr.message };

  // Fetch team codes for this match
  const { data: match } = await service
    .from("matches")
    .select("home_team_code, away_team_code")
    .eq("id", matchId)
    .single();

  // Upsert match_stats (goals only; cards entered separately in Phase 7)
  if (match?.home_team_code) {
    await service.from("match_stats").upsert(
      [
        { match_id: matchId, team_code: match.home_team_code, goals: homeGoals },
        { match_id: matchId, team_code: match.away_team_code, goals: awayGoals },
      ],
      { onConflict: "match_id,team_code" }
    );
  }

  revalidatePath("/admin/results");
  revalidatePath("/");
  revalidatePath("/bracket");
  revalidatePath("/today");
  return { success: true };
}

/** Create a new knockout match (teams determined after group stage). */
export async function createKnockoutMatch(formData: FormData): Promise<ActionResult> {
  const stage           = formData.get("stage") as string;
  const homeTeamCode    = (formData.get("home_team_code") as string)?.trim().toUpperCase() || null;
  const awayTeamCode    = (formData.get("away_team_code") as string)?.trim().toUpperCase() || null;
  const kickoffUtc      = (formData.get("kickoff_utc") as string)?.trim();
  const homeFeedMatchId = (formData.get("home_feed_match_id") as string)?.trim() || null;
  const awayFeedMatchId = (formData.get("away_feed_match_id") as string)?.trim() || null;

  if (!stage || !kickoffUtc || isNaN(Date.parse(kickoffUtc))) {
    return { error: "Stage and a valid UTC kickoff time are required." };
  }

  const service = createServiceClient();
  const { error } = await service.from("matches").insert({
    stage,
    home_team_code: homeTeamCode,
    away_team_code: awayTeamCode,
    kickoff_utc: kickoffUtc,
    status: "scheduled",
    home_feed_match_id: homeFeedMatchId,
    away_feed_match_id: awayFeedMatchId,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/results");
  revalidatePath("/bracket");
  return { success: true };
}

/** Edit the teams and kickoff time of an existing knockout match. */
export async function updateKnockoutMatch(formData: FormData): Promise<ActionResult> {
  const matchId      = formData.get("match_id") as string;
  const homeTeamCode = (formData.get("home_team_code") as string)?.trim().toUpperCase() || null;
  const awayTeamCode = (formData.get("away_team_code") as string)?.trim().toUpperCase() || null;
  const kickoffUtc   = (formData.get("kickoff_utc") as string)?.trim();

  if (!kickoffUtc || isNaN(Date.parse(kickoffUtc))) {
    return { error: "A valid UTC kickoff time is required (e.g. 2026-07-01T19:00:00Z)." };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("matches")
    .update({ home_team_code: homeTeamCode, away_team_code: awayTeamCode, kickoff_utc: kickoffUtc })
    .eq("id", matchId)
    .neq("stage", "group");

  if (error) return { error: error.message };
  revalidatePath("/admin/results");
  revalidatePath("/bracket");
  revalidatePath("/today");
  return { success: true };
}

/** Delete a knockout match. Guard prevents deleting group-stage matches. */
export async function deleteKnockoutMatch(matchId: string): Promise<ActionResult> {
  const service = createServiceClient();
  const { error } = await service
    .from("matches")
    .delete()
    .eq("id", matchId)
    .neq("stage", "group");

  if (error) return { error: error.message };
  revalidatePath("/admin/results");
  revalidatePath("/bracket");
  revalidatePath("/today");
  return { success: true };
}

/** Set bracket progression wiring for a knockout match (which earlier matches feed each slot). */
export async function setMatchFeeds(
  matchId: string,
  homeFeedId: string | null,
  awayFeedId: string | null,
  homeFeedOutcome: 'winner' | 'loser' = 'winner',
  awayFeedOutcome: 'winner' | 'loser' = 'winner'
): Promise<ActionResult> {
  const service = createServiceClient();
  const { error } = await service.from("matches").update({
    home_feed_match_id: homeFeedId || null,
    away_feed_match_id: awayFeedId || null,
    home_feed_outcome: homeFeedOutcome,
    away_feed_outcome: awayFeedOutcome,
  }).eq("id", matchId);

  if (error) return { error: error.message };
  revalidatePath("/admin/results");
  revalidatePath("/bracket");
  return { success: true };
}
