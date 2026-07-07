// API-Football v3 client (api-sports.io). Server-side only — never import from client code.
// API key is read from API_FOOTBALL_KEY env var at call time (not module load).

import type {
  ApiResponse, ApiFixture, ApiFixtureEvent,
  ApiFixturePlayers, ApiTeam, ApiPlayerProfile, ApiPlayerStat,
} from "./types";

const BASE_URL = process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io";

function cfg() {
  return {
    key:      process.env.API_FOOTBALL_KEY ?? "",
    leagueId: process.env.API_FOOTBALL_LEAGUE_ID ?? "1",
    season:   process.env.API_FOOTBALL_SEASON ?? "2026",
  };
}

async function apiFetch<T>(
  path: string,
  params: Record<string, string>
): Promise<ApiResponse<T>> {
  const { key } = cfg();
  if (!key) throw new Error("API_FOOTBALL_KEY is not set");

  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": key, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}: ${res.statusText}`);
  return res.json() as Promise<ApiResponse<T>>;
}

/** All live WC2026 fixtures. 1 API request. */
export function getLiveFixtures(): Promise<ApiResponse<ApiFixture>> {
  const { leagueId, season } = cfg();
  return apiFetch<ApiFixture>("/fixtures", {
    league: leagueId, season,
    status: "1H-HT-2H-ET-BT-P-INT-LIVE",
  });
}

/** All WC2026 fixtures on a given date (YYYY-MM-DD). 1 API request. */
export function getFixturesByDate(date: string): Promise<ApiResponse<ApiFixture>> {
  const { leagueId, season } = cfg();
  return apiFetch<ApiFixture>("/fixtures", { league: leagueId, season, date });
}

/** All match events (goals, cards) for a fixture. 1 API request. */
export function getFixtureEvents(fixtureApiId: string): Promise<ApiResponse<ApiFixtureEvent>> {
  return apiFetch<ApiFixtureEvent>("/fixtures/events", { fixture: fixtureApiId });
}

/** Per-player stats for a fixture (goals, assists, minutes). 1 API request. */
export function getFixturePlayers(fixtureApiId: string): Promise<ApiResponse<ApiFixturePlayers>> {
  return apiFetch<ApiFixturePlayers>("/fixtures/players", { fixture: fixtureApiId });
}

/** Cumulative season stats for a player in WC2026. 1 API request. */
export function getPlayerSeasonStats(apiPlayerId: string): Promise<ApiResponse<ApiPlayerStat>> {
  const { leagueId, season } = cfg();
  return apiFetch<ApiPlayerStat>("/players", {
    id: apiPlayerId, league: leagueId, season,
  });
}

/** Search teams by name (for admin ID-mapping setup). 1 API request. */
export function searchTeams(name: string): Promise<ApiResponse<ApiTeam>> {
  return apiFetch<ApiTeam>("/teams", { search: name });
}

/** Search players by name (for admin ID-mapping setup). 1 API request. */
export function searchPlayers(name: string): Promise<ApiResponse<ApiPlayerProfile>> {
  return apiFetch<ApiPlayerProfile>("/players/profiles", { search: name });
}
