"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { runSync } from "@/lib/sync/engine";
import { runEspnSync } from "@/lib/sync/espn-engine";
import { searchTeams, searchPlayers } from "@/lib/api-football/client";
import { getTeams as getEspnTeams } from "@/lib/espn/client";

interface ActionResult { success?: boolean; error?: string; }

// ── ID Mapping ───────────────────────────────────────────────────────────────
// Shared by both sync sources — api_id_mappings is keyed on
// (resource_type, internal_id, provider), so the same team/match can carry an
// api-football mapping and an espn mapping side by side without conflict.

export async function setMapping(
  resourceType: "team" | "player",
  internalId: string,
  apiId: string,
  provider: "api-football" | "espn" = "api-football"
): Promise<ActionResult> {
  if (!apiId.trim()) return { error: "API ID is required." };
  const service = createServiceClient();
  const { error } = await service.from("api_id_mappings").upsert(
    {
      resource_type: resourceType,
      internal_id: internalId,
      provider,
      api_id: apiId.trim(),
      verified: true,
    },
    { onConflict: "resource_type,internal_id,provider" }
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/sync");
  return { success: true };
}

export async function removeMapping(id: string): Promise<ActionResult> {
  const service = createServiceClient();
  const { error } = await service.from("api_id_mappings").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/sync");
  return { success: true };
}

// ── Manual sync trigger ──────────────────────────────────────────────────────

export async function triggerManualSync(): Promise<{ error?: string; result?: Awaited<ReturnType<typeof runSync>> }> {
  try {
    const result = await runSync("manual", true);
    revalidatePath("/admin/sync");
    return { result };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function triggerManualEspnSync(): Promise<{ error?: string; result?: Awaited<ReturnType<typeof runEspnSync>> }> {
  try {
    const result = await runEspnSync("manual", true);
    revalidatePath("/admin/sync");
    return { result };
  } catch (e) {
    return { error: String(e) };
  }
}

// ── Card override controls ───────────────────────────────────────────────────

export async function clearCardOverride(matchId: string, teamCode: string): Promise<ActionResult> {
  const service = createServiceClient();
  const { data } = await service
    .from("match_stats")
    .select("yellows_auto, second_yellows_auto, straight_reds_auto")
    .eq("match_id", matchId).eq("team_code", teamCode).single();

  const { error } = await service.from("match_stats").update({
    yellows_manual:        null,
    second_yellows_manual: null,
    straight_reds_manual:  null,
    yellows:               data?.yellows_auto        ?? 0,
    second_yellows:        data?.second_yellows_auto ?? 0,
    straight_reds:         data?.straight_reds_auto  ?? 0,
  }).eq("match_id", matchId).eq("team_code", teamCode);

  if (error) return { error: error.message };
  revalidatePath("/admin/sidepots");
  revalidatePath("/admin/sync");
  revalidatePath("/payouts");
  return { success: true };
}

export async function clearMatchScoreOverride(matchId: string): Promise<ActionResult> {
  const service = createServiceClient();
  const { data } = await service
    .from("matches")
    .select("home_goals_auto, away_goals_auto, status_auto")
    .eq("id", matchId).single();

  const { error } = await service.from("matches").update({
    home_goals_manual: null,
    away_goals_manual: null,
    status_manual:     null,
    home_goals:        data?.home_goals_auto ?? null,
    away_goals:        data?.away_goals_auto ?? null,
    status:            data?.status_auto     ?? "scheduled",
  }).eq("id", matchId);

  if (error) return { error: error.message };
  revalidatePath("/admin/results");
  revalidatePath("/admin/sync");
  revalidatePath("/");
  return { success: true };
}

// ── API search helpers (for mapping setup) ───────────────────────────────────

export async function apiSearchTeams(name: string): Promise<{
  teams?: Array<{ id: number; name: string; code: string | null }>;
  error?: string;
}> {
  if (!name.trim()) return { teams: [] };
  if (!process.env.API_FOOTBALL_KEY) return { error: "API_FOOTBALL_KEY not configured." };
  try {
    const resp = await searchTeams(name.trim());
    return { teams: (resp.response ?? []).map((t) => ({ id: t.team.id, name: t.team.name, code: t.team.code })) };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function apiSearchPlayers(name: string): Promise<{
  players?: Array<{ id: number; name: string }>;
  error?: string;
}> {
  if (!name.trim()) return { players: [] };
  if (!process.env.API_FOOTBALL_KEY) return { error: "API_FOOTBALL_KEY not configured." };
  try {
    const resp = await searchPlayers(name.trim());
    return { players: (resp.response ?? []).map((p) => ({ id: p.player.id, name: p.player.name })) };
  } catch (e) {
    return { error: String(e) };
  }
}

/** ESPN has no search endpoint — lists all tournament teams for the admin to filter. */
export async function espnSearchTeams(name: string): Promise<{
  teams?: Array<{ id: string; name: string }>;
  error?: string;
}> {
  try {
    const resp = await getEspnTeams();
    const all = (resp.sports?.[0]?.leagues?.[0]?.teams ?? []).map((t) => ({
      id: t.team.id,
      name: t.team.displayName,
    }));
    if (!name.trim()) return { teams: all };
    const q = name.trim().toLowerCase();
    return { teams: all.filter((t) => t.name.toLowerCase().includes(q)) };
  } catch (e) {
    return { error: String(e) };
  }
}
