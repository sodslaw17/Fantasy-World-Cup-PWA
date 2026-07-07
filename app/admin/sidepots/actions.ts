"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

interface ActionResult { success?: boolean; error?: string; }

// ── Efficiency picks ─────────────────────────────────────────────────────────

export async function saveEfficiencyPick(
  profileId: string,
  formData: FormData
): Promise<ActionResult> {
  const playerName    = (formData.get("player_name") as string)?.trim();
  const teamCode      = (formData.get("team_code") as string)?.trim().toUpperCase() || null;
  const playerPhotoUrl = (formData.get("player_photo_url") as string)?.trim() || null;

  if (!playerName) return { error: "Player name required." };

  const service = createServiceClient();
  const { error } = await service.from("efficiency_picks").upsert(
    {
      profile_id: profileId, player_name: playerName, team_code: teamCode,
      player_photo_url: playerPhotoUrl,
    },
    { onConflict: "profile_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/admin/sidepots");
  revalidatePath("/payouts");
  revalidatePath("/");
  return { success: true };
}

// ── Efficiency per-game stats (migration 016) ────────────────────────────────
// One row per (pick, match). goals/assists/minutes here are always the
// admin-entered value for that single game; efficiency_picks.goals/assists/
// minutes is kept as their SUM by a DB trigger, so the scoring/leaderboard
// code is untouched.

/**
 * Bulk-saves every game row for one pick's table in a single call (so the
 * admin fills in the whole table, then hits one "Save" button).
 * `matchId: null` addresses the single migrated "prior total" bucket row.
 */
export async function saveEfficiencyMatchStats(
  pickId: string,
  rows: Array<{ matchId: string | null; goals: number; assists: number; minutes: number }>
): Promise<ActionResult> {
  const service = createServiceClient();

  const gameRows  = rows.filter((r) => r.matchId !== null);
  const priorTotal = rows.find((r) => r.matchId === null) ?? null;

  if (gameRows.length > 0) {
    const { error } = await service.from("efficiency_match_stats").upsert(
      gameRows.map((r) => ({
        efficiency_pick_id: pickId,
        match_id: r.matchId,
        is_prior_total: false,
        goals: r.goals, assists: r.assists, minutes: r.minutes,
      })),
      { onConflict: "efficiency_pick_id,match_id" }
    );
    if (error) return { error: error.message };
  }

  if (priorTotal) {
    const { data: existing } = await service
      .from("efficiency_match_stats")
      .select("id")
      .eq("efficiency_pick_id", pickId)
      .is("match_id", null)
      .maybeSingle();

    const { error } = existing
      ? await service.from("efficiency_match_stats")
          .update({ goals: priorTotal.goals, assists: priorTotal.assists, minutes: priorTotal.minutes })
          .eq("id", existing.id)
      : await service.from("efficiency_match_stats").insert({
          efficiency_pick_id: pickId, match_id: null, is_prior_total: true,
          goals: priorTotal.goals, assists: priorTotal.assists, minutes: priorTotal.minutes,
        });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/sidepots");
  revalidatePath("/payouts");
  revalidatePath("/");
  return { success: true };
}

export async function deleteEfficiencyMatchStat(id: string): Promise<ActionResult> {
  const service = createServiceClient();
  const { error } = await service.from("efficiency_match_stats").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/sidepots");
  revalidatePath("/payouts");
  revalidatePath("/");
  return { success: true };
}

export async function updateEfficiencyPhoto(
  profileId: string,
  photoUrl: string | null
): Promise<ActionResult> {
  const service = createServiceClient();
  const { error } = await service
    .from("efficiency_picks")
    .update({ player_photo_url: photoUrl })
    .eq("profile_id", profileId);
  if (error) return { error: error.message };
  revalidatePath("/admin/sidepots");
  revalidatePath("/");
  return { success: true };
}

// ── Cards (discipline) ───────────────────────────────────────────────────────

export async function saveMatchCards(
  matchId: string,
  teamCode: string,
  formData: FormData
): Promise<ActionResult> {
  const yellows      = parseInt(formData.get("yellows") as string) || 0;
  const secondYellows = parseInt(formData.get("second_yellows") as string) || 0;
  const straightReds = parseInt(formData.get("straight_reds") as string) || 0;

  const service = createServiceClient();
  const { error } = await service.from("match_stats").upsert(
    {
      match_id: matchId, team_code: teamCode,
      yellows, yellows_manual: yellows,
      second_yellows: secondYellows, second_yellows_manual: secondYellows,
      straight_reds: straightReds, straight_reds_manual: straightReds,
    },
    { onConflict: "match_id,team_code" }
  );

  if (error) return { error: error.message };
  revalidatePath("/admin/sidepots");
  revalidatePath("/payouts");
  return { success: true };
}

// ── Penalty events ───────────────────────────────────────────────────────────

export async function addPenaltyEvent(formData: FormData): Promise<ActionResult> {
  const matchId    = formData.get("match_id") as string;
  const teamCode   = (formData.get("team_code") as string)?.trim().toUpperCase();
  const playerName = (formData.get("player_name") as string)?.trim() || null;
  const type       = formData.get("type") as string;

  if (!matchId || !teamCode || !type) return { error: "Match, team, and type are required." };

  const service = createServiceClient();
  const { error } = await service.from("penalty_events").insert({
    match_id: matchId, team_code: teamCode, player_name: playerName, type,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/sidepots");
  revalidatePath("/payouts");
  return { success: true };
}

export async function removePenaltyEvent(eventId: string): Promise<ActionResult> {
  const service = createServiceClient();
  const { error } = await service.from("penalty_events").delete().eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath("/admin/sidepots");
  revalidatePath("/payouts");
  return { success: true };
}
