import { describe, it, expect } from "vitest";
import {
  computeEfficiency,
  computeEfficiencyLeaderboard,
  computeCardPoints,
  computeDisciplineLeaderboard,
} from "./sidepots";

// ── computeEfficiency ───────────────────────────────────────────────────────

describe("computeEfficiency", () => {
  it("basic efficiency calculation", () => {
    expect(computeEfficiency(3, 2, 90)).toBeCloseTo(5 / 90);
  });

  it("0 minutes returns 0 (no division by zero)", () => {
    expect(computeEfficiency(5, 5, 0)).toBe(0);
  });

  it("0 goals and 0 assists returns 0", () => {
    expect(computeEfficiency(0, 0, 90)).toBe(0);
  });

  it("goals only, no assists", () => {
    expect(computeEfficiency(4, 0, 60)).toBeCloseTo(4 / 60);
  });

  it("higher efficiency wins: 1G/30min > 1G/90min", () => {
    const a = computeEfficiency(1, 0, 30);
    const b = computeEfficiency(1, 0, 90);
    expect(a).toBeGreaterThan(b);
  });
});

// ── computeEfficiencyLeaderboard ────────────────────────────────────────────

describe("computeEfficiencyLeaderboard", () => {
  const picks = [
    { profileId: "p1", displayName: "Alice", playerName: "Messi",   teamCode: "ARG", goals: 5, assists: 3, minutes: 360 },
    { profileId: "p2", displayName: "Bob",   playerName: "Ronaldo", teamCode: "POR", goals: 3, assists: 1, minutes: 270 },
    { profileId: "p3", displayName: "Carl",  playerName: "Mbappe",  teamCode: "FRA", goals: 4, assists: 4, minutes: 270 },
  ];

  it("ranks by efficiency descending", () => {
    const result = computeEfficiencyLeaderboard(picks);
    // Carl: 8/270 ≈ 0.0296, Bob: 4/270 ≈ 0.0148, Alice: 8/360 ≈ 0.0222
    // Order: Carl > Alice > Bob
    expect(result[0].displayName).toBe("Carl");
    expect(result[1].displayName).toBe("Alice");
    expect(result[2].displayName).toBe("Bob");
  });

  it("assigns correct ranks", () => {
    const result = computeEfficiencyLeaderboard(picks);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
    expect(result[2].rank).toBe(3);
  });

  it("tied efficiency = same rank", () => {
    const tied = [
      { profileId: "p1", displayName: "Alice", playerName: "X", teamCode: null, goals: 1, assists: 0, minutes: 90 },
      { profileId: "p2", displayName: "Bob",   playerName: "Y", teamCode: null, goals: 1, assists: 0, minutes: 90 },
    ];
    const result = computeEfficiencyLeaderboard(tied);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
  });

  it("empty input returns empty", () => {
    expect(computeEfficiencyLeaderboard([])).toEqual([]);
  });
});

// ── computeCardPoints ───────────────────────────────────────────────────────

describe("computeCardPoints", () => {
  it("1st yellow = 1 pt", () => expect(computeCardPoints(1, 0, 0)).toBe(1));
  it("2nd yellow = 2 pts", () => expect(computeCardPoints(0, 1, 0)).toBe(2));
  it("straight red = 4 pts", () => expect(computeCardPoints(0, 0, 1)).toBe(4));
  it("two-yellow red = 1+2 = 3 pts (confirmed rule §C)", () => {
    expect(computeCardPoints(1, 1, 0)).toBe(3);
  });
  it("mixed: 2 yellows + 1 2YR + 1 straight red = 2+2+4 = 8", () => {
    expect(computeCardPoints(2, 1, 1)).toBe(8);
  });
  it("all zeros = 0", () => expect(computeCardPoints(0, 0, 0)).toBe(0));
});

// ── computeDisciplineLeaderboard ────────────────────────────────────────────

describe("computeDisciplineLeaderboard", () => {
  const profiles = [
    { id: "p1", display_name: "Alice", auth_id: "u1" },
    { id: "p2", display_name: "Bob",   auth_id: "u2" },
    { id: "p3", display_name: "Carol", auth_id: null }, // not logged in
  ];
  const drafts = [
    { profile_id: "p1", team_code: "BRA" },
    { profile_id: "p1", team_code: "FRA" },
    { profile_id: "p1", team_code: "GER" },
    { profile_id: "p2", team_code: "ARG" },
    { profile_id: "p2", team_code: "ESP" },
    { profile_id: "p2", team_code: "ENG" },
  ];
  const matchStats = [
    { team_code: "BRA", yellows: 2, second_yellows: 0, straight_reds: 0 }, // 2 pts
    { team_code: "FRA", yellows: 1, second_yellows: 1, straight_reds: 0 }, // 3 pts
    { team_code: "GER", yellows: 0, second_yellows: 0, straight_reds: 1 }, // 4 pts
    { team_code: "ARG", yellows: 1, second_yellows: 0, straight_reds: 0 }, // 1 pt
    { team_code: "ESP", yellows: 0, second_yellows: 0, straight_reds: 0 }, // 0 pts
    { team_code: "ENG", yellows: 2, second_yellows: 0, straight_reds: 0 }, // 2 pts
  ];

  it("sums card points across all drafted teams", () => {
    const result = computeDisciplineLeaderboard(profiles, drafts, matchStats);
    const alice = result.find((e) => e.displayName === "Alice")!;
    const bob   = result.find((e) => e.displayName === "Bob")!;
    expect(alice.totalCardPoints).toBe(9); // 2+3+4
    expect(bob.totalCardPoints).toBe(3);   // 1+0+2
  });

  it("highest card points = rank 1 (worst discipline wins pot)", () => {
    const result = computeDisciplineLeaderboard(profiles, drafts, matchStats);
    expect(result[0].displayName).toBe("Alice");
    expect(result[0].rank).toBe(1);
    expect(result[1].displayName).toBe("Bob");
  });

  it("excludes users with null auth_id", () => {
    const result = computeDisciplineLeaderboard(profiles, drafts, matchStats);
    expect(result.find((e) => e.displayName === "Carol")).toBeUndefined();
  });

  it("users with no drafts get 0 card points", () => {
    const result = computeDisciplineLeaderboard(profiles, [], matchStats);
    result.forEach((e) => expect(e.totalCardPoints).toBe(0));
  });
});
