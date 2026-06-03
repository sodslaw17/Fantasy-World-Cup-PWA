import { describe, it, expect } from "vitest";
import { computeOverallLeaderboard } from "./overall";
import type { KnockoutMatch } from "./knockout";

const profiles = [
  { id: "p1", auth_id: "u1", display_name: "Alice" },
  { id: "p2", auth_id: "u2", display_name: "Bob" },
];

const finishedGroup = {
  id: "gm1",
  home_goals: 1,
  away_goals: 2,
  status: "finished",
};

const scheduledGroup = {
  id: "gm2",
  home_goals: null,
  away_goals: null,
  status: "scheduled",
};

const koMatch: KnockoutMatch = {
  id: "km1",
  stage: "r16",
  home_team_code: "BRA",
  away_team_code: "ARG",
  home_goals: 2,
  away_goals: 1,
  went_to_shootout: false,
  shootout_winner: null,
  status: "finished",
};

describe("computeOverallLeaderboard — combined ranking", () => {
  it("sums group and knockout points into total", () => {
    const preds = [
      { user_id: "u1", match_id: "gm1", home_goals_pred: 1, away_goals_pred: 2 }, // exact → 3pts
      { user_id: "u2", match_id: "gm1", home_goals_pred: 2, away_goals_pred: 1 }, // wrong → 0pts
    ];
    const drafts = [
      { profile_id: "p1", team_code: "ARG" }, // ARG loses 1-2 → 0 win + 1 goal = 1 KO pt
      { profile_id: "p2", team_code: "BRA" }, // BRA wins 2-1 → +2 win + 2 goals = 4 KO pts
    ];

    const result = computeOverallLeaderboard(
      profiles,
      [finishedGroup],
      preds,
      drafts,
      [koMatch],
      []
    );

    const alice = result.find((e) => e.displayName === "Alice")!;
    const bob = result.find((e) => e.displayName === "Bob")!;

    expect(alice.groupPoints).toBe(3);
    expect(alice.knockoutPoints).toBe(1);
    expect(alice.totalPoints).toBe(4);

    expect(bob.groupPoints).toBe(0);
    expect(bob.knockoutPoints).toBe(4);
    expect(bob.totalPoints).toBe(4);
  });

  it("tiebreaker: higher GD wins", () => {
    // Both 4 pts; BRA has GD +1, ARG has GD -1
    const preds = [
      { user_id: "u1", match_id: "gm1", home_goals_pred: 1, away_goals_pred: 2 },
      { user_id: "u2", match_id: "gm1", home_goals_pred: 2, away_goals_pred: 1 },
    ];
    const drafts = [
      { profile_id: "p1", team_code: "ARG" }, // GD = 1-2 = -1
      { profile_id: "p2", team_code: "BRA" }, // GD = 2-1 = +1
    ];

    const result = computeOverallLeaderboard(
      profiles,
      [finishedGroup],
      preds,
      drafts,
      [koMatch],
      []
    );

    // Bob (BRA, GD+1) beats Alice (ARG, GD-1) despite equal total
    expect(result[0].displayName).toBe("Bob");
    expect(result[1].displayName).toBe("Alice");
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it("no knockout matches → total = group points only", () => {
    const preds = [
      { user_id: "u1", match_id: "gm1", home_goals_pred: 1, away_goals_pred: 2 }, // 3pts
    ];
    const result = computeOverallLeaderboard(profiles, [finishedGroup], preds, [], [], []);
    const alice = result.find((e) => e.displayName === "Alice")!;
    expect(alice.totalPoints).toBe(3);
    expect(alice.knockoutPoints).toBe(0);
  });

  it("users without drafts get 0 knockout points", () => {
    const result = computeOverallLeaderboard(profiles, [scheduledGroup], [], [], [koMatch], []);
    result.forEach((e) => {
      expect(e.knockoutPoints).toBe(0);
    });
  });
});
