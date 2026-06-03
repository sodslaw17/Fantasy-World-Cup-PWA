import { describe, it, expect } from "vitest";
import { computeLeaderboard } from "./leaderboard";

const profiles = [
  { id: "p1", auth_id: "u1", display_name: "Alice" },
  { id: "p2", auth_id: "u2", display_name: "Bob" },
  { id: "p3", auth_id: "u3", display_name: "Charlie" },
  { id: "p4", auth_id: null, display_name: "Unregistered" }, // never logged in
];

const finishedMatch = { id: "m1", home_goals: 1, away_goals: 2, status: "finished" };
const scheduledMatch = { id: "m2", home_goals: null, away_goals: null, status: "scheduled" };

describe("computeLeaderboard — basic ranking", () => {
  it("excludes users who have never logged in (auth_id null)", () => {
    const result = computeLeaderboard(profiles, [finishedMatch], []);
    expect(result.find((e) => e.displayName === "Unregistered")).toBeUndefined();
    expect(result.length).toBe(3);
  });

  it("scores correctly: exact=3, outcome=2, wrong=0", () => {
    const predictions = [
      { user_id: "u1", match_id: "m1", home_goals_pred: 1, away_goals_pred: 2 }, // exact → 3
      { user_id: "u2", match_id: "m1", home_goals_pred: 0, away_goals_pred: 1 }, // away win → 2
      { user_id: "u3", match_id: "m1", home_goals_pred: 2, away_goals_pred: 1 }, // wrong → 0
    ];
    const result = computeLeaderboard(profiles, [finishedMatch], predictions);
    expect(result[0]).toMatchObject({ displayName: "Alice", points: 3, rank: 1 });
    expect(result[1]).toMatchObject({ displayName: "Bob", points: 2, rank: 2 });
    expect(result[2]).toMatchObject({ displayName: "Charlie", points: 0, rank: 3 });
  });

  it("unplayed matches do not contribute points", () => {
    const predictions = [
      { user_id: "u1", match_id: "m2", home_goals_pred: 1, away_goals_pred: 0 },
    ];
    const result = computeLeaderboard(profiles, [scheduledMatch], predictions);
    expect(result.every((e) => e.points === 0)).toBe(true);
  });
});

describe("computeLeaderboard — tiebreaker", () => {
  it("equal points: lower predicted total wins", () => {
    // actual total = 3 (1+2), both wrong outcome → 0 pts
    // Alice predicted 1+0=1 total, Bob predicted 2+1=3 total
    // actual total = 3, |alice - 3| = 2, |bob - 3| = 0 → bob wins tiebreaker
    const predictions = [
      { user_id: "u1", match_id: "m1", home_goals_pred: 1, away_goals_pred: 0 }, // wrong, pred total = 1
      { user_id: "u2", match_id: "m1", home_goals_pred: 2, away_goals_pred: 1 }, // wrong, pred total = 3 (exact actual)
    ];
    const result = computeLeaderboard(
      profiles.slice(0, 2),
      [finishedMatch],
      predictions
    );
    expect(result[0].displayName).toBe("Bob"); // closer to actual total of 3
  });

  it("equal points, equidistant predicted total: lower predicted total wins", () => {
    // actual = 3, alice=1 (err 2), bob=5 (err 2) → alice wins (lower)
    const predictions = [
      { user_id: "u1", match_id: "m1", home_goals_pred: 1, away_goals_pred: 0 }, // total=1, err=2
      { user_id: "u2", match_id: "m1", home_goals_pred: 3, away_goals_pred: 2 }, // total=5, err=2
    ];
    const result = computeLeaderboard(
      profiles.slice(0, 2),
      [finishedMatch],
      predictions
    );
    expect(result[0].displayName).toBe("Alice"); // lower predicted total wins
  });

  it("tied users get the same rank", () => {
    // Both predict exact same score → identical points and predicted total → tied
    const predictions = [
      { user_id: "u1", match_id: "m1", home_goals_pred: 1, away_goals_pred: 2 },
      { user_id: "u2", match_id: "m1", home_goals_pred: 1, away_goals_pred: 2 },
    ];
    const result = computeLeaderboard(
      profiles.slice(0, 2),
      [finishedMatch],
      predictions
    );
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
  });
});

describe("computeLeaderboard — standard competition ranking", () => {
  it("two tied at 1st → next is 3rd", () => {
    const predictions = [
      { user_id: "u1", match_id: "m1", home_goals_pred: 1, away_goals_pred: 2 }, // 3pts
      { user_id: "u2", match_id: "m1", home_goals_pred: 1, away_goals_pred: 2 }, // 3pts
      { user_id: "u3", match_id: "m1", home_goals_pred: 2, away_goals_pred: 1 }, // 0pts
    ];
    const result = computeLeaderboard(profiles.slice(0, 3), [finishedMatch], predictions);
    const ranks = result.map((e) => e.rank);
    expect(ranks).toContain(1);
    expect(ranks).toContain(3);
    expect(ranks).not.toContain(2);
  });
});
