// ESPN's public soccer scoreboard API (site.api.espn.com) — unofficial, free,
// no key required. This is the ONLY file that should ever construct an ESPN
// URL: swap or disable the source by editing this module alone.
//
// Treat this as a best-effort source: ESPN can change response shape or go
// down without notice. Every call either resolves with a validated shape or
// throws a plain Error — callers (the ESPN sync engine) are responsible for
// catching, logging, and continuing without touching existing data.

import type { EspnScoreboardResponse, EspnTeamsResponse } from "./types";

const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer";

function leagueSlug(): string {
  // Verified against the live API: this is ESPN's slug for the FIFA World Cup.
  return process.env.ESPN_SOCCER_LEAGUE ?? "fifa.world";
}

/** All events on a given UTC date ("YYYYMMDD"). 1 HTTP request, no key needed. */
export async function getScoreboardByDate(dateYYYYMMDD: string): Promise<EspnScoreboardResponse> {
  const url = `${BASE_URL}/${leagueSlug()}/scoreboard?dates=${dateYYYYMMDD}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ESPN scoreboard ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  if (!json || !Array.isArray(json.events)) {
    throw new Error("ESPN scoreboard: unexpected response shape (missing events[])");
  }
  return json as EspnScoreboardResponse;
}

/** All teams in the tournament (for admin mapping search). 1 HTTP request, no key. */
export async function getTeams(): Promise<EspnTeamsResponse> {
  const url = `${BASE_URL}/${leagueSlug()}/teams?limit=100`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ESPN teams ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  if (!json?.sports?.[0]?.leagues?.[0]?.teams) {
    throw new Error("ESPN teams: unexpected response shape");
  }
  return json as EspnTeamsResponse;
}
