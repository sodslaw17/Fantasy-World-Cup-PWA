"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { BracketMatch } from "@/components/bracket/BracketView";
import type { Match } from "@/lib/db";

export async function getBracketData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { matchesByStage: {} };

  const service = createServiceClient();

  const [{ data: matches }, { data: teams }, { data: rawDrafts }, { data: profiles }] =
    await Promise.all([
      service.from("matches").select("*").neq("stage", "group").order("kickoff_utc"),
      service.from("teams").select("fifa_code, name"),
      service.from("drafts").select("profile_id, team_id"),
      service.from("profiles").select("id, display_name, avatar_url"),
    ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t: { fifa_code: string; name: string }) => [t.fifa_code, t.name])
  );

  // Build team_id → fifa_code
  const teamCodeById: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t: { fifa_code: string; id?: string }) => [t.fifa_code, t.fifa_code])
  );

  // Fetch team codes for draft team_ids separately
  const draftTeamIds = (rawDrafts ?? []).map((d: { team_id: string }) => d.team_id);
  const { data: draftTeams } = draftTeamIds.length > 0
    ? await service.from("teams").select("id, fifa_code").in("id", draftTeamIds)
    : { data: [] };

  const idToCode: Record<string, string> = Object.fromEntries(
    (draftTeams ?? []).map((t: { id: string; fifa_code: string }) => [t.id, t.fifa_code])
  );

  // Build: team_code → profileId
  const teamOwner: Record<string, string> = {};
  for (const d of rawDrafts ?? []) {
    const code = idToCode[(d as { team_id: string }).team_id];
    if (code) teamOwner[code] = (d as { profile_id: string }).profile_id;
  }

  // Build: profileId → { name, avatarUrl }
  const profileMap: Record<string, { name: string; avatarUrl: string | null }> = Object.fromEntries(
    (profiles ?? []).map((p: { id: string; display_name: string; avatar_url: string | null }) => [
      p.id,
      { name: p.display_name, avatarUrl: p.avatar_url },
    ])
  );

  const enriched: BracketMatch[] = (matches ?? []).map((m: Match) => {
    const homeOwnerProfileId = m.home_team_code ? teamOwner[m.home_team_code] : null;
    const awayOwnerProfileId = m.away_team_code ? teamOwner[m.away_team_code] : null;

    return {
      ...m,
      homeTeamName: teamNames[m.home_team_code ?? ""] ?? m.home_team_code ?? "TBD",
      awayTeamName: teamNames[m.away_team_code ?? ""] ?? m.away_team_code ?? "TBD",
      homeOwner: homeOwnerProfileId ? (profileMap[homeOwnerProfileId] ?? null) : null,
      awayOwner: awayOwnerProfileId ? (profileMap[awayOwnerProfileId] ?? null) : null,
    };
  });

  const matchesByStage: Record<string, BracketMatch[]> = {};
  for (const m of enriched) {
    (matchesByStage[m.stage] ??= []).push(m);
  }

  return { matchesByStage };
}
