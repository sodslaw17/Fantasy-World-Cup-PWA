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
  const goals         = parseInt(formData.get("goals") as string) || 0;
  const assists       = parseInt(formData.get("assists") as string) || 0;
  const minutes       = parseInt(formData.get("minutes") as string) || 0;

  if (!playerName) return { error: "Player name required." };

  const service = createServiceClient();
  const { error } = await service.from("efficiency_picks").upsert(
    { profile_id: profileId, player_name: playerName, team_code: teamCode, player_photo_url: playerPhotoUrl, goals, assists, minutes },
    { onConflict: "profile_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/admin/sidepots");
  revalidatePath("/payouts");
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
    { match_id: matchId, team_code: teamCode, yellows, second_yellows: secondYellows, straight_reds: straightReds },
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
