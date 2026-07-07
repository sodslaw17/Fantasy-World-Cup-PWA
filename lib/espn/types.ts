// ESPN public soccer scoreboard response shapes (site.api.espn.com). Unofficial
// and undocumented — only the fields we actually consume are typed, and every
// field here was checked against a live response before being relied on.

export interface EspnScoreboardResponse {
  events: EspnEvent[];
}

export interface EspnEvent {
  id: string;
  date: string;
  name: string;
  competitions: EspnCompetition[];
  status: EspnStatus;
}

export interface EspnCompetition {
  id: string;
  competitors: EspnCompetitor[];
  details?: EspnDetail[];
  status: EspnStatus;
}

export interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  winner?: boolean;
  score: string;
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
  };
}

export interface EspnStatus {
  type: {
    id: string;
    name: string;
    // "pre" | "in" | "post" in practice, but ESPN doesn't document this enum —
    // treat anything other than pre/post as "in progress".
    state: string;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

export interface EspnTeamsResponse {
  sports: Array<{
    leagues: Array<{
      teams: Array<{
        team: { id: string; displayName: string; abbreviation: string };
      }>;
    }>;
  }>;
}

export interface EspnDetail {
  type: { id: string; text: string };
  clock: { value: number; displayValue: string };
  team: { id: string };
  scoringPlay: boolean;
  redCard: boolean;
  yellowCard: boolean;
  athletesInvolved?: Array<{ id: string; displayName: string }>;
}
