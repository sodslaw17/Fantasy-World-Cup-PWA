// Core sync engine: fetches live match data from API-Football and writes
// auto_value columns, then updates effective columns as COALESCE(manual, auto).
// Manual values are NEVER overwritten here — only the sync engine writes _auto cols.

import { createServiceClient } from "@/lib/supabase/service";
import * as apiClient from "@/lib/api-football/client";
import { mapFixtureStatus, mapCardsFromEvents } from "@/lib/api-football/mappers";
import { isInLiveWindow, recentDates } from "./schedule";

export interface SyncResult {
  logId: string;
  inLiveWindow: boolean;
  skipped: boolean;
  matchesChecked: number;
  matchesUpdated: number;
  statsUpdated: number;
  picksUpdated: number;
  apiRequests: number;
  unmappedTeams: string[];
  unmappedPlayers: string[];
  errors: string[];
}

type Counters = Omit<SyncResult, "logId">;

export async function runSync(
  trigger: "cron" | "manual",
  force = false
): Promise<SyncResult> {
  const db = createServiceClient();

  const { data: logEntry } = await db
    .from("sync_log")
    .insert({ trigger, status: "running" })
    .select("id")
    .single();
  const logId = logEntry?.id ?? "unknown";

  const c: Counters = {
    inLiveWindow: false,
    skipped: false,
    matchesChecked: 0,
    matchesUpdated: 0,
    statsUpdated: 0,
    picksUpdated: 0,
    apiRequests: 0,
    unmappedTeams: [],
    unmappedPlayers: [],
    errors: [],
  };

  try {
    if (!process.env.API_FOOTBALL_KEY) {
      c.errors.push("API_FOOTBALL_KEY not configured");
      await finalize(db, logId, "error", c);
      return { logId, ...c };
    }

    const { data: allMatches } = await db
      .from("matches")
      .select("id, kickoff_utc, status, home_team_code, away_team_code");

    if (!allMatches?.length) {
      c.skipped = true;
      await finalize(db, logId, "skipped", c);
      return { logId, ...c };
    }

    c.inLiveWindow = isInLiveWindow(allMatches);

    if (!c.inLiveWindow && trigger === "cron" && !force) {
      c.skipped = true;
      await finalize(db, logId, "skipped", c);
      return { logId, ...c };
    }

    // ── Load all mappings ────────────────────────────────────────────────────

    const { data: mappings } = await db
      .from("api_id_mappings")
      .select("resource_type, internal_id, api_id");

    const teamApiId:    Record<string, string> = {};  // teams.id       → api_id
    const fixtureApiId: Record<string, string> = {};  // matches.id     → api_id
    const playerApiId:  Record<string, string> = {};  // eff_picks.id   → api_id

    for (const m of mappings ?? []) {
      if (m.resource_type === "team")    teamApiId[m.internal_id]    = m.api_id;
      if (m.resource_type === "fixture") fixtureApiId[m.internal_id] = m.api_id;
      if (m.resource_type === "player")  playerApiId[m.internal_id]  = m.api_id;
    }

    const { data: teams } = await db.from("teams").select("id, fifa_code");
    const teamIdByCode: Record<string, string> = Object.fromEntries(
      (teams ?? []).map((t) => [t.fifa_code, t.id])
    );

    // ── Fetch fixtures from API ──────────────────────────────────────────────

    const dates = recentDates();
    const responses = await Promise.all([
      apiClient.getLiveFixtures(),
      ...dates.map((d) => apiClient.getFixturesByDate(d)),
    ]);
    c.apiRequests += responses.length;

    const dedupedFixtures: Record<number, (typeof responses)[0]["response"][0]> = {};
    for (const r of responses) {
      for (const f of r.response ?? []) dedupedFixtures[f.fixture.id] = f;
    }

    const apiFixtureByTeamPair: Record<string, (typeof dedupedFixtures)[number]> = {};
    for (const f of Object.values(dedupedFixtures)) {
      apiFixtureByTeamPair[`${f.teams.home.id}-${f.teams.away.id}`] = f;
    }

    // ── Determine matches to sync (live or active within 25h) ────────────────

    const now = Date.now();
    const SYNC_HORIZON_MS = 25 * 60 * 60 * 1000;

    const matchesToSync = allMatches.filter((m) => {
      const kickoff = new Date(m.kickoff_utc).getTime();
      const withinHorizon = now - kickoff < SYNC_HORIZON_MS;
      const matchHasStarted = now >= kickoff - 30 * 60 * 1000;
      return withinHorizon && matchHasStarted;
    });

    c.matchesChecked = matchesToSync.length;

    // ── Sync each match ───────────────────────────────────────────────────────

    for (const dbMatch of matchesToSync) {
      try {
        await syncOneMatch(db, dbMatch, teamIdByCode, teamApiId, fixtureApiId, apiFixtureByTeamPair, c);
      } catch (e) {
        c.errors.push(`match ${dbMatch.id}: ${String(e)}`);
      }
    }

    // ── Sync efficiency picks ─────────────────────────────────────────────────
    // As of migration 016, efficiency_picks.goals/assists/minutes are owned by
    // a DB trigger that sums the pick's efficiency_match_stats rows (entered
    // per game by the admin) — this loop no longer writes those columns, since
    // overwriting them with a season-cumulative API snapshot would fight the
    // trigger and double-count games already entered manually. It still
    // records the auto season snapshot for reference in the admin sync UI.

    const { data: picks } = await db
      .from("efficiency_picks")
      .select("id, player_name");

    for (const pick of picks ?? []) {
      const apiId = playerApiId[pick.id];
      if (!apiId) {
        if (!c.unmappedPlayers.includes(pick.player_name)) c.unmappedPlayers.push(pick.player_name);
        continue;
      }
      try {
        const resp = await apiClient.getPlayerSeasonStats(apiId);
        c.apiRequests++;
        const stats = resp.response?.[0]?.statistics?.[0];
        const goalsAuto   = stats?.goals.total    ?? 0;
        const assistsAuto = stats?.goals.assists  ?? 0;
        const minutesAuto = stats?.games.minutes  ?? 0;

        const { error } = await db.from("efficiency_picks").update({
          goals_auto:     goalsAuto,
          assists_auto:   assistsAuto,
          minutes_auto:   minutesAuto,
          last_synced_at: new Date().toISOString(),
        }).eq("id", pick.id);

        if (!error) c.picksUpdated++;
      } catch (e) {
        c.errors.push(`player ${pick.player_name}: ${String(e)}`);
      }
    }

    await finalize(db, logId, c.errors.length ? "error" : "ok", c);
  } catch (e) {
    c.errors.push(`fatal: ${String(e)}`);
    await finalize(db, logId, "error", c);
  }

  return { logId, ...c };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

type DbClient = ReturnType<typeof createServiceClient>;

type ApiFixtureLike = {
  fixture: { id: number; status: { short: string } };
  goals: { home: number | null; away: number | null };
  teams: { home: { id: number }; away: { id: number } };
};

async function syncOneMatch(
  db: DbClient,
  dbMatch: { id: string; status: string; home_team_code: string | null; away_team_code: string | null; kickoff_utc: string },
  teamIdByCode: Record<string, string>,
  teamApiId: Record<string, string>,
  fixtureApiId: Record<string, string>,
  apiByTeamPair: Record<string, ApiFixtureLike>,
  c: Counters
) {
  // Resolve API fixture: prefer an existing fixture mapping, fall back to team-pair lookup.
  let apiFixture: ApiFixtureLike | null = null;
  const existingApiId = fixtureApiId[dbMatch.id];

  if (existingApiId) {
    apiFixture = Object.values(apiByTeamPair).find(
      (f) => String(f.fixture.id) === existingApiId
    ) ?? null;
  }

  if (!apiFixture && dbMatch.home_team_code && dbMatch.away_team_code) {
    const homeInternalId = teamIdByCode[dbMatch.home_team_code];
    const awayInternalId = teamIdByCode[dbMatch.away_team_code];
    if (!homeInternalId || !awayInternalId) return;

    const homeApi = teamApiId[homeInternalId];
    const awayApi = teamApiId[awayInternalId];

    if (!homeApi || !awayApi) {
      if (dbMatch.home_team_code && !c.unmappedTeams.includes(dbMatch.home_team_code))
        c.unmappedTeams.push(dbMatch.home_team_code);
      if (dbMatch.away_team_code && !c.unmappedTeams.includes(dbMatch.away_team_code))
        c.unmappedTeams.push(dbMatch.away_team_code);
      return;
    }

    apiFixture = apiByTeamPair[`${homeApi}-${awayApi}`] ?? null;

    // Auto-store fixture mapping so we don't re-derive it each run.
    if (apiFixture) {
      await db.from("api_id_mappings").upsert(
        {
          resource_type: "fixture",
          internal_id: dbMatch.id,
          provider: "api-football",
          api_id: String(apiFixture.fixture.id),
        },
        { onConflict: "resource_type,internal_id,provider" }
      );
    }
  }

  if (!apiFixture) return;

  // Update match auto columns + effective (never touch manual).
  const { data: current } = await db
    .from("matches")
    .select("home_goals_manual, away_goals_manual, status_manual")
    .eq("id", dbMatch.id)
    .single();

  const statusAuto    = mapFixtureStatus(apiFixture.fixture.status.short);
  const homeGoalsAuto = apiFixture.goals.home;
  const awayGoalsAuto = apiFixture.goals.away;

  const { error: matchErr } = await db.from("matches").update({
    home_goals_auto:  homeGoalsAuto,
    away_goals_auto:  awayGoalsAuto,
    status_auto:      statusAuto,
    home_goals:       current?.home_goals_manual ?? homeGoalsAuto,
    away_goals:       current?.away_goals_manual ?? awayGoalsAuto,
    status:           current?.status_manual     ?? statusAuto,
    last_synced_at:   new Date().toISOString(),
  }).eq("id", dbMatch.id);

  if (!matchErr) c.matchesUpdated++;

  // Sync cards from events for live and recently-finished matches.
  if (["live", "finished"].includes(statusAuto)) {
    await syncCardsForFixture(
      db,
      dbMatch.id,
      String(apiFixture.fixture.id),
      apiFixture.teams.home.id,
      apiFixture.teams.away.id,
      dbMatch.home_team_code!,
      dbMatch.away_team_code!,
      c
    );
  }
}

async function syncCardsForFixture(
  db: DbClient,
  matchId: string,
  fixtureApiId: string,
  homeApiTeamId: number,
  awayApiTeamId: number,
  homeCode: string,
  awayCode: string,
  c: Counters
) {
  const eventsResp = await apiClient.getFixtureEvents(fixtureApiId);
  c.apiRequests++;
  const events = eventsResp.response ?? [];

  const { data: existingStats } = await db
    .from("match_stats")
    .select("team_code, yellows_manual, second_yellows_manual, straight_reds_manual")
    .eq("match_id", matchId);

  const statsByCode = Object.fromEntries(
    (existingStats ?? []).map((s) => [s.team_code, s])
  );

  for (const [code, apiTeamId] of [[homeCode, homeApiTeamId], [awayCode, awayApiTeamId]] as const) {
    const { yellows, secondYellows, straightReds } = mapCardsFromEvents(events, apiTeamId);
    const existing = statsByCode[code];

    const { error } = await db.from("match_stats").upsert(
      {
        match_id:             matchId,
        team_code:            code,
        yellows_auto:         yellows,
        second_yellows_auto:  secondYellows,
        straight_reds_auto:   straightReds,
        yellows:              existing?.yellows_manual        ?? yellows,
        second_yellows:       existing?.second_yellows_manual ?? secondYellows,
        straight_reds:        existing?.straight_reds_manual  ?? straightReds,
        last_synced_at:       new Date().toISOString(),
      },
      { onConflict: "match_id,team_code" }
    );

    if (!error) c.statsUpdated++;
  }
}

async function finalize(db: DbClient, logId: string, status: string, c: Counters) {
  await db.from("sync_log").update({
    finished_at:      new Date().toISOString(),
    status,
    in_live_window:   c.inLiveWindow,
    skipped:          c.skipped,
    matches_checked:  c.matchesChecked,
    matches_updated:  c.matchesUpdated,
    stats_updated:    c.statsUpdated,
    picks_updated:    c.picksUpdated,
    api_requests:     c.apiRequests,
    unmapped_teams:   c.unmappedTeams,
    unmapped_players: c.unmappedPlayers,
    errors:           c.errors,
  }).eq("id", logId);
}
