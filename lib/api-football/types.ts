// API-Football v3 response shapes (api-sports.io).
// Only the fields we consume are typed.

export interface ApiResponse<T> {
  results: number;
  errors: string[] | Record<string, string>;
  response: T[];
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      // NS=not started, 1H/HT/2H/ET/BT/P/INT/LIVE=live, FT/AET/PEN=finished
      // PST/CANC/ABD/WO=other
      short: string;
      elapsed: number | null;
    };
  };
  teams: {
    home: { id: number; name: string; };
    away: { id: number; name: string; };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export interface ApiFixtureEvent {
  time:   { elapsed: number; extra: number | null; };
  team:   { id: number; name: string; };
  player: { id: number | null; name: string | null; };
  type:   string;   // "Card" | "Goal" | "Var" | "subst"
  detail: string;   // "Yellow Card" | "Red Card" | "Yellow Red Card" | "Normal Goal" | ...
}

export interface ApiPlayerStat {
  player: { id: number; name: string; };
  statistics: Array<{
    games:  { minutes: number | null; };
    goals:  { total: number | null; assists: number | null; };
    cards:  { yellow: number; red: number; };
  }>;
}

export interface ApiFixturePlayers {
  team:    { id: number; name: string; };
  players: ApiPlayerStat[];
}

export interface ApiTeam {
  team: { id: number; name: string; code: string | null; };
}

export interface ApiPlayerProfile {
  player: { id: number; name: string; };
}
