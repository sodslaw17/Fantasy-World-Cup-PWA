// ESPN sync engine: fetches live scores from ESPN's public (unofficial)
// scoreboard and writes auto_* columns, then recomputes effective columns as
// COALESCE(manual, auto) — manual values are NEVER overwritten here.
//
// This is a fully separate, independently swappable pipeline from
// lib/sync/engine.ts (API-Football): same auto/manual/effective model, same
// api_id_mappings table, distinguished by provider = "espn" instead of
// "api-football". Disabling ESPN entirely means not calling runEspnSync —
// nothing else in the app depends on it.

import { createServiceClient } from "@/lib/supabase/service";
import * as espnClient from "@/lib/espn/client";
import { mapEspnStatus, mapCardsFromDetails } from "@/lib/espn/mappers";
import { isInLiveWindow, recentDates } from "./schedule";
import type { EspnEvent, EspnDetail } from "@/lib/espn/types";

export interface EspnSyncResult {
  logId: string;
  inLiveWindow: boolean;
  skipped: boolean;
  matchesChecked: number;
  matchesUpdated: number;
  statsUpdated: number;
  apiRequests: number;
  unmappedTeams: string[];
  errors: string[];
}

type Counters = Omit<EspnSyncResult, "logId">;

export async function runEspnSync(
  trigger: "cron" | "manual",
  force = false
): Promise<EspnSyncResult> {
  const db = createServiceClient();

  const { data: logEntry } = await db
    .from("sync_log")
    .insert({ trigger, status: "running", source: "espn" })
    .select("id")
    .single();
  const logId = logEntry?.id ?? "unknown";

  const c: Counters = {
    inLiveWindow: false,
    skipped: false,
    matchesChecked: 0,
    matchesUpdated: 0,
    statsUpdated: 0,
    apiRequests: 0,
    unmappedTeams: [],
    errors: [],
  };

  try {
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

    // ── Load ESPN-provider mappings ──────────────────────────────────────────

    const { data: mappings } = await db
      .from("api_id_mappings")
      .select("resource_type, internal_id, api_id")
      .eq("provider", "espn");

    const teamEspnId: Record<string, string> = {};    // teams.id   → espn team id
    const fixtureEspnId: Record<string, string> = {}; // matches.id → espn event id

    for (const m of mappings ?? []) {
      if (m.resource_type === "team")    teamEspnId[m.internal_id]    = m.api_id;
      if (m.resource_type === "fixture") fixtureEspnId[m.internal_id] = m.api_id;
    }

    const { data: teams } = await db.from("teams").select("id, fifa_code");
    const teamIdByCode: Record<string, string> = Object.fromEntries(
      (teams ?? []).map((t) => [t.fifa_code, t.id])
    );

    // ── Fetch ESPN scoreboard for today + yesterday (covers overnight games) ──
    // A fetch failure here is swallowed into c.errors: espnEvents stays empty,
    // so the match loop below finds nothing to match against and touches
    // nothing — existing manual/auto data is left exactly as it was.

    const dates = recentDates();
    let espnEvents: EspnEvent[] = [];
    try {
      const responses = await Promise.all(
        dates.map((d) => espnClient.getScoreboardByDate(d.replace(/-/g, "")))
      );
      c.apiRequests += responses.length;
      const dedupe: Record<string, EspnEvent> = {};
      for (const r of responses) for (const ev of r.events ?? []) dedupe[ev.id] = ev;
      espnEvents = Object.values(dedupe);
    } catch (e) {
      c.errors.push(`ESPN scoreboard fetch failed: ${String(e)}`);
      console.error("[espn-sync] scoreboard fetch failed:", e);
    }

    const eventByEspnTeamPair: Record<string, EspnEvent> = {};
    for (const ev of espnEvents) {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors.find((x) => x.homeAway === "home");
      const away = comp?.competitors.find((x) => x.homeAway === "away");
      if (home && away) eventByEspnTeamPair[`${home.team.id}-${away.team.id}`] = ev;
    }

    // ── Determine matches to sync (live or active within a 25h horizon) ────────

    const now = Date.now();
    const SYNC_HORIZON_MS = 25 * 60 * 60 * 1000;
    const matchesToSync = allMatches.filter((m) => {
      const kickoff = new Date(m.kickoff_utc).getTime();
      const withinHorizon = now - kickoff < SYNC_HORIZON_MS;
      const matchHasStarted = now >= kickoff - 30 * 60 * 1000;
      return withinHorizon && matchHasStarted;
    });
    c.matchesChecked = matchesToSync.length;

    for (const dbMatch of matchesToSync) {
      try {
        await syncOneMatch(db, dbMatch, teamIdByCode, teamEspnId, fixtureEspnId, eventByEspnTeamPair, c);
      } catch (e) {
        c.errors.push(`match ${dbMatch.id}: ${String(e)}`);
        console.error("[espn-sync] match sync failed:", dbMatch.id, e);
      }
    }

    await finalize(db, logId, c.errors.length ? "error" : "ok", c);
  } catch (e) {
    c.errors.push(`fatal: ${String(e)}`);
    console.error("[espn-sync] fatal:", e);
    await finalize(db, logId, "error", c);
  }

  return { logId, ...c };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

type DbClient = ReturnType<typeof createServiceClient>;

async function syncOneMatch(
  db: DbClient,
  dbMatch: { id: string; status: string; home_team_code: string | null; away_team_code: string | null; kickoff_utc: string },
  teamIdByCode: Record<string, string>,
  teamEspnId: Record<string, string>,
  fixtureEspnId: Record<string, string>,
  eventByTeamPair: Record<string, EspnEvent>,
  c: Counters
) {
  // Resolve ESPN event: prefer an existing fixture mapping, fall back to team-pair lookup.
  let event: EspnEvent | null = null;
  const existingEspnId = fixtureEspnId[dbMatch.id];

  if (existingEspnId) {
    event = Object.values(eventByTeamPair).find((ev) => ev.id === existingEspnId) ?? null;
  }

  if (!event && dbMatch.home_team_code && dbMatch.away_team_code) {
    const homeInternalId = teamIdByCode[dbMatch.home_team_code];
    const awayInternalId = teamIdByCode[dbMatch.away_team_code];
    if (!homeInternalId || !awayInternalId) return;

    const homeEspn = teamEspnId[homeInternalId];
    const awayEspn = teamEspnId[awayInternalId];

    if (!homeEspn || !awayEspn) {
      // Unmapped — skipped and flagged, never guessed.
      if (!homeEspn && !c.unmappedTeams.includes(dbMatch.home_team_code)) c.unmappedTeams.push(dbMatch.home_team_code);
      if (!awayEspn && !c.unmappedTeams.includes(dbMatch.away_team_code)) c.unmappedTeams.push(dbMatch.away_team_code);
      return;
    }

    event = eventByTeamPair[`${homeEspn}-${awayEspn}`] ?? null;

    // Auto-store fixture mapping so we don't re-derive it each run.
    if (event) {
      await db.from("api_id_mappings").upsert(
        {
          resource_type: "fixture",
          internal_id: dbMatch.id,
          provider: "espn",
          api_id: event.id,
        },
        { onConflict: "resource_type,internal_id,provider" }
      );
    }
  }

  if (!event) return;

  const comp = event.competitions[0];
  const homeComp = comp?.competitors.find((x) => x.homeAway === "home");
  const awayComp = comp?.competitors.find((x) => x.homeAway === "away");
  if (!comp || !homeComp || !awayComp) return;

  // Update match auto columns + effective (never touch manual).
  const { data: current } = await db
    .from("matches")
    .select("home_goals_manual, away_goals_manual, status_manual")
    .eq("id", dbMatch.id)
    .single();

  const statusAuto = mapEspnStatus(comp.status ?? event.status);
  const homeGoalsAuto = Number(homeComp.score);
  const awayGoalsAuto = Number(awayComp.score);
  const homeGoalsAutoValid = Number.isFinite(homeGoalsAuto) ? homeGoalsAuto : null;
  const awayGoalsAutoValid = Number.isFinite(awayGoalsAuto) ? awayGoalsAuto : null;

  const { error: matchErr } = await db.from("matches").update({
    home_goals_auto:  homeGoalsAutoValid,
    away_goals_auto:  awayGoalsAutoValid,
    status_auto:      statusAuto,
    home_goals:       current?.home_goals_manual ?? homeGoalsAutoValid,
    away_goals:       current?.away_goals_manual ?? awayGoalsAutoValid,
    status:           current?.status_manual     ?? statusAuto,
    last_synced_at:   new Date().toISOString(),
  }).eq("id", dbMatch.id);

  if (!matchErr) c.matchesUpdated++;

  // Cards — only once the match has actually kicked off, and only if ESPN
  // included the `details` array for this competition (not always present).
  if (["live", "finished"].includes(statusAuto) && Array.isArray(comp.details)) {
    await syncCardsForFixture(
      db,
      dbMatch.id,
      comp.details,
      homeComp.team.id,
      awayComp.team.id,
      dbMatch.home_team_code!,
      dbMatch.away_team_code!,
      c
    );
  }
}

async function syncCardsForFixture(
  db: DbClient,
  matchId: string,
  details: EspnDetail[],
  homeEspnTeamId: string,
  awayEspnTeamId: string,
  homeCode: string,
  awayCode: string,
  c: Counters
) {
  const { data: existingStats } = await db
    .from("match_stats")
    .select("team_code, yellows_manual, second_yellows_manual, straight_reds_manual")
    .eq("match_id", matchId);

  const statsByCode = Object.fromEntries(
    (existingStats ?? []).map((s) => [s.team_code, s])
  );

  for (const [code, espnTeamId] of [[homeCode, homeEspnTeamId], [awayCode, awayEspnTeamId]] as const) {
    const { yellows, secondYellows, straightReds } = mapCardsFromDetails(details, espnTeamId);
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
    finished_at:     new Date().toISOString(),
    status,
    in_live_window:  c.inLiveWindow,
    skipped:         c.skipped,
    matches_checked: c.matchesChecked,
    matches_updated: c.matchesUpdated,
    stats_updated:   c.statsUpdated,
    api_requests:    c.apiRequests,
    unmapped_teams:  c.unmappedTeams,
    errors:          c.errors,
  }).eq("id", logId);
}
