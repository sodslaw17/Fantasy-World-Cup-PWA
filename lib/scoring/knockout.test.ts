import { describe, it, expect } from "vitest";
import {
  scoreKnockoutMatch,
  scorePenaltyEvent,
  totalKnockoutPoints,
  teamKnockoutGD,
  draftedTeamsGD,
  type KnockoutMatch,
} from "./knockout";

const base: KnockoutMatch = {
  id: "m1",
  stage: "r16",
  home_team_code: "BRA",
  away_team_code: "ARG",
  home_goals: 0,
  away_goals: 0,
  went_to_shootout: false,
  shootout_winner: null,
  status: "finished",
};

// ── scoreKnockoutMatch ──────────────────────────────────────────────────────

describe("scoreKnockoutMatch — win in open play", () => {
  const m: KnockoutMatch = { ...base, home_goals: 2, away_goals: 1 };

  it("winner gets +2 + goals", () => {
    expect(scoreKnockoutMatch(m, "BRA")).toBe(2 + 2); // +2 win + 2 goals
  });

  it("loser gets only goals", () => {
    expect(scoreKnockoutMatch(m, "ARG")).toBe(1); // 0 win + 1 goal
  });

  it("team not in match returns 0", () => {
    expect(scoreKnockoutMatch(m, "GER")).toBe(0);
  });
});

describe("scoreKnockoutMatch — penalty shootout", () => {
  const m: KnockoutMatch = {
    ...base,
    home_goals: 1,
    away_goals: 1,
    went_to_shootout: true,
    shootout_winner: "away",
  };

  it("shootout winner: +2 win + goals", () => {
    expect(scoreKnockoutMatch(m, "ARG")).toBe(2 + 1); // +2 win + 1 goal
  });

  it("shootout loser: +1 pen-loss + goals", () => {
    expect(scoreKnockoutMatch(m, "BRA")).toBe(1 + 1); // +1 pen-loss + 1 goal
  });
});

describe("scoreKnockoutMatch — zero goals", () => {
  const m: KnockoutMatch = {
    ...base,
    home_goals: 0,
    away_goals: 0,
    went_to_shootout: true,
    shootout_winner: "home",
  };

  it("shootout winner 0-0: +2 only", () => {
    expect(scoreKnockoutMatch(m, "BRA")).toBe(2);
  });

  it("shootout loser 0-0: +1 only", () => {
    expect(scoreKnockoutMatch(m, "ARG")).toBe(1);
  });
});

describe("scoreKnockoutMatch — bronze final (§5.4 confirmed rules)", () => {
  const bronze: KnockoutMatch = {
    ...base,
    stage: "bronze",
    home_goals: 2,
    away_goals: 1,
  };

  it("bronze winner gets +1 (not +2) + goals", () => {
    expect(scoreKnockoutMatch(bronze, "BRA")).toBe(1 + 2); // +1 win + 2 goals
  });

  it("bronze loser gets only goals (no pen-loss bonus)", () => {
    expect(scoreKnockoutMatch(bronze, "ARG")).toBe(1); // 0 win + 1 goal
  });

  it("bronze shootout loser does NOT get pen-loss +1", () => {
    const bronzeShoot: KnockoutMatch = {
      ...bronze,
      home_goals: 1,
      away_goals: 1,
      went_to_shootout: true,
      shootout_winner: "home",
    };
    // ARG lost on pens — no +1 in bronze
    expect(scoreKnockoutMatch(bronzeShoot, "ARG")).toBe(1); // goals only
  });
});

describe("scoreKnockoutMatch — high-scoring match", () => {
  it("big win: +2 + all goals counted", () => {
    const m: KnockoutMatch = { ...base, home_goals: 5, away_goals: 3 };
    expect(scoreKnockoutMatch(m, "BRA")).toBe(2 + 5); // win + 5 goals
    expect(scoreKnockoutMatch(m, "ARG")).toBe(3);     // loss + 3 goals
  });
});

// ── scorePenaltyEvent ───────────────────────────────────────────────────────

describe("scorePenaltyEvent", () => {
  it("off_target → -1", () => expect(scorePenaltyEvent("off_target")).toBe(-1));
  it("panenka_fail → -1", () => expect(scorePenaltyEvent("panenka_fail")).toBe(-1));
  it("panenka_score → +1", () => expect(scorePenaltyEvent("panenka_score")).toBe(1));
});

// ── totalKnockoutPoints ─────────────────────────────────────────────────────

describe("totalKnockoutPoints", () => {
  const m1: KnockoutMatch = { ...base, id: "m1", home_goals: 2, away_goals: 0 }; // BRA wins
  const m2: KnockoutMatch = {
    ...base,
    id: "m2",
    home_team_code: "FRA",
    away_team_code: "GER",
    home_goals: 1,
    away_goals: 1,
    went_to_shootout: true,
    shootout_winner: "away",
  };

  it("sums across multiple drafted teams and matches", () => {
    const pts = totalKnockoutPoints(
      ["BRA", "GER"],
      [m1, m2],
      []
    );
    // BRA: +2 win + 2 goals = 4
    // GER: +2 win on pens + 1 goal = 3
    expect(pts).toBe(7);
  });

  it("includes penalty event adjustments", () => {
    const pts = totalKnockoutPoints(
      ["BRA"],
      [m1],
      [
        { match_id: "m1", team_code: "BRA", type: "panenka_score" }, // +1
        { match_id: "m1", team_code: "BRA", type: "off_target" },    // -1
      ]
    );
    // BRA match: 4 + penalty net: 0 = 4
    expect(pts).toBe(4);
  });

  it("penalty events for non-drafted teams are ignored", () => {
    const pts = totalKnockoutPoints(
      ["BRA"],
      [m1],
      [{ match_id: "m1", team_code: "ARG", type: "panenka_score" }]
    );
    expect(pts).toBe(4); // ARG not drafted, event ignored
  });
});

// ── goal difference ─────────────────────────────────────────────────────────

describe("teamKnockoutGD", () => {
  const matches: KnockoutMatch[] = [
    { ...base, id: "m1", home_goals: 3, away_goals: 1 }, // BRA 3-1 ARG
    {
      ...base,
      id: "m2",
      stage: "qf",
      home_team_code: "BRA",
      away_team_code: "FRA",
      home_goals: 0,
      away_goals: 2,
    }, // BRA 0-2 FRA
  ];

  it("accumulates GD across multiple matches", () => {
    // BRA: (3-1) + (0-2) = +2 - 2 = 0
    expect(teamKnockoutGD(matches, "BRA")).toBe(0);
  });

  it("team not appearing returns 0", () => {
    expect(teamKnockoutGD(matches, "GER")).toBe(0);
  });
});

describe("draftedTeamsGD", () => {
  const matches: KnockoutMatch[] = [
    { ...base, id: "m1", home_goals: 2, away_goals: 0 }, // BRA +2 GD, ARG -2 GD
    {
      ...base,
      id: "m2",
      home_team_code: "FRA",
      away_team_code: "GER",
      home_goals: 1,
      away_goals: 1,
      went_to_shootout: true,
      shootout_winner: "away",
    }, // FRA -0 GD, GER +0 GD (equal)
  ];

  it("sums GD across all drafted teams", () => {
    // BRA: +2, GER: 0 → total = +2
    expect(draftedTeamsGD(matches, ["BRA", "GER"])).toBe(2);
  });
});
