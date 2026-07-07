import { createServiceClient } from "@/lib/supabase/service";
import { AdminPageHeader } from "../_components/AdminShell";
import { SyncDashboard } from "@/components/admin/sync/SyncDashboard";
import type { TeamRow, PlayerRow, SyncLogEntry } from "@/components/admin/sync/SyncDashboard";
import { isInLiveWindow } from "@/lib/sync/schedule";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live Sync — WC26 Admin" };

export default async function SyncPage() {
  const db = createServiceClient();

  const [
    { data: teamsData },
    { data: mappings },
    { data: effPicks },
    { data: profiles },
    { data: logData },
    { data: allMatches },
  ] = await Promise.all([
    db.from("teams").select("id, fifa_code, name").order("name"),
    db.from("api_id_mappings").select("id, resource_type, internal_id, api_id"),
    db.from("efficiency_picks").select("id, profile_id, player_name, team_code, last_synced_at"),
    db.from("profiles").select("id, display_name"),
    db.from("sync_log").select("*").order("started_at", { ascending: false }).limit(15),
    db.from("matches").select("kickoff_utc, status"),
  ]);

  const teamMappings = Object.fromEntries(
    (mappings ?? [])
      .filter((m) => m.resource_type === "team")
      .map((m) => [m.internal_id, { id: m.id, apiId: m.api_id }])
  );

  const playerMappings = Object.fromEntries(
    (mappings ?? [])
      .filter((m) => m.resource_type === "player")
      .map((m) => [m.internal_id, { id: m.id, apiId: m.api_id }])
  );

  const profileNames = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.display_name])
  );

  const teams: TeamRow[] = (teamsData ?? []).map((t) => ({
    id: t.id,
    fifaCode: t.fifa_code,
    name: t.name,
    apiId: teamMappings[t.id]?.apiId ?? null,
    mappingId: teamMappings[t.id]?.id ?? null,
  }));

  const players: PlayerRow[] = (effPicks ?? []).map((p) => ({
    pickId: p.id,
    displayName: profileNames[p.profile_id] ?? "Unknown",
    playerName: p.player_name,
    teamCode: p.team_code,
    apiId: playerMappings[p.id]?.apiId ?? null,
    mappingId: playerMappings[p.id]?.id ?? null,
    lastSyncedAt: p.last_synced_at ?? null,
  }));

  const log: SyncLogEntry[] = (logData ?? []).map((l) => ({
    id: l.id,
    startedAt: l.started_at,
    finishedAt: l.finished_at ?? null,
    trigger: l.trigger,
    status: l.status,
    inLiveWindow: l.in_live_window,
    skipped: l.skipped,
    matchesChecked: l.matches_checked,
    matchesUpdated: l.matches_updated,
    statsUpdated: l.stats_updated,
    picksUpdated: l.picks_updated,
    apiRequests: l.api_requests,
    unmappedTeams: l.unmapped_teams ?? [],
    unmappedPlayers: l.unmapped_players ?? [],
    errors: l.errors ?? [],
  }));

  const inLiveWindow = isInLiveWindow(allMatches ?? []);
  const apiKeyConfigured = Boolean(process.env.API_FOOTBALL_KEY);

  return (
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader
        title="Live Sync"
        sub="API-Football ID mappings · Auto-sync scores, cards, efficiency stats"
      />
      <div className="px-4 pb-8">
        <SyncDashboard
          teams={teams}
          players={players}
          log={log}
          inLiveWindow={inLiveWindow}
          apiKeyConfigured={apiKeyConfigured}
        />
      </div>
    </div>
  );
}
