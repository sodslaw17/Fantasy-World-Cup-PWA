import { describe, it, expect } from "vitest";
import {
  scoreGroupMatch,
  totalGroupPoints,
  sumPredictedGoals,
  compareGroupTiebreaker,
} from "./group";

// ── scoreGroupMatch ─────────────────────────────────────────────────────────

describe("scoreGroupMatch — spec worked example (MEX 1 – RSA 2)", () => {
  const result = { home_goals: 1, away_goals: 2 };

  it("Player 1: predicted MEX 2–1 RSA → 0 pts (wrong outcome)", () => {
    expect(scoreGroupMatch(result, { home_goals_pred: 2, away_goals_pred: 1 })).toBe(0);
  });

  it("Player 2: predicted MEX 1–3 RSA → 2 pts (correct outcome, wrong score)", () => {
    expect(scoreGroupMatch(result, { home_goals_pred: 1, away_goals_pred: 3 })).toBe(2);
  });

  it("Player 3: predicted MEX 1–2 RSA → 3 pts (exact score)", () => {
    expect(scoreGroupMatch(result, { home_goals_pred: 1, away_goals_pred: 2 })).toBe(3);
  });
});

describe("scoreGroupMatch — home wins", () => {
  const result = { home_goals: 3, away_goals: 1 };

  it("exact score → 3", () => {
    expect(scoreGroupMatch(result, { home_goals_pred: 3, away_goals_pred: 1 })).toBe(3);
  });

  it("correct outcome, different margin → 2", () => {
    expect(scoreGroupMatch(result, { home_goals_pred: 2, away_goals_pred: 0 })).toBe(2);
  });

  it("predicted draw → 0", () => {
    expect(scoreGroupMatch(result, { home_goals_pred: 1, away_goals_pred: 1 })).toBe(0);
  });

  it("predicted away win → 0", () => {
    expect(scoreGroupMatch(result, { home_goals_pred: 0, away_goals_pred: 2 })).toBe(0);
  });
});

describe("scoreGroupMatch — draws", () => {
  it("exact 0-0 → 3", () => {
    expect(scoreGroupMatch({ home_goals: 0, away_goals: 0 }, { home_goals_pred: 0, away_goals_pred: 0 })).toBe(3);
  });

  it("correct draw, wrong score → 2", () => {
    expect(scoreGroupMatch({ home_goals: 1, away_goals: 1 }, { home_goals_pred: 2, away_goals_pred: 2 })).toBe(2);
  });

  it("predicted draw but home won → 0", () => {
    expect(scoreGroupMatch({ home_goals: 2, away_goals: 1 }, { home_goals_pred: 1, away_goals_pred: 1 })).toBe(0);
  });

  it("exact 2-2 → 3", () => {
    expect(scoreGroupMatch({ home_goals: 2, away_goals: 2 }, { home_goals_pred: 2, away_goals_pred: 2 })).toBe(3);
  });
});

describe("scoreGroupMatch — edge cases", () => {
  it("0-0 actual, predicted 1-0 → 0 (wrong outcome)", () => {
    expect(scoreGroupMatch({ home_goals: 0, away_goals: 0 }, { home_goals_pred: 1, away_goals_pred: 0 })).toBe(0);
  });

  it("high-scoring exact match → 3", () => {
    expect(scoreGroupMatch({ home_goals: 5, away_goals: 3 }, { home_goals_pred: 5, away_goals_pred: 3 })).toBe(3);
  });
});

// ── totalGroupPoints ────────────────────────────────────────────────────────

describe("totalGroupPoints", () => {
  it("sums 3 + 2 + 0 = 5", () => {
    expect(
      totalGroupPoints([
        { result: { home_goals: 1, away_goals: 2 }, pred: { home_goals_pred: 1, away_goals_pred: 2 } }, // 3
        { result: { home_goals: 1, away_goals: 2 }, pred: { home_goals_pred: 1, away_goals_pred: 3 } }, // 2
        { result: { home_goals: 1, away_goals: 2 }, pred: { home_goals_pred: 2, away_goals_pred: 1 } }, // 0
      ])
    ).toBe(5);
  });

  it("six correct outcomes = 12 pts", () => {
    const pairs = Array(6).fill({
      result: { home_goals: 2, away_goals: 0 },
      pred: { home_goals_pred: 1, away_goals_pred: 0 },
    });
    expect(totalGroupPoints(pairs)).toBe(12);
  });

  it("six exact scores = 18 pts (max for a group)", () => {
    const pairs = Array(6).fill({
      result: { home_goals: 2, away_goals: 1 },
      pred: { home_goals_pred: 2, away_goals_pred: 1 },
    });
    expect(totalGroupPoints(pairs)).toBe(18);
  });

  it("empty list = 0", () => {
    expect(totalGroupPoints([])).toBe(0);
  });
});

// ── sumPredictedGoals ───────────────────────────────────────────────────────

describe("sumPredictedGoals", () => {
  it("sums all home and away predicted goals", () => {
    expect(
      sumPredictedGoals([
        { home_goals_pred: 2, away_goals_pred: 1 },
        { home_goals_pred: 0, away_goals_pred: 0 },
        { home_goals_pred: 3, away_goals_pred: 2 },
      ])
    ).toBe(8);
  });

  it("empty list = 0", () => {
    expect(sumPredictedGoals([])).toBe(0);
  });
});

// ── compareGroupTiebreaker ──────────────────────────────────────────────────

describe("compareGroupTiebreaker", () => {
  it("lower absolute error wins: a=98 (err 2) beats b=105 (err 5)", () => {
    expect(compareGroupTiebreaker(98, 105, 100)).toBeLessThan(0);
  });

  it("higher absolute error loses: a=105 (err 5) loses to b=98 (err 2)", () => {
    expect(compareGroupTiebreaker(105, 98, 100)).toBeGreaterThan(0);
  });

  it("equidistant: lower prediction wins — a=98, b=102, actual=100 → a wins", () => {
    expect(compareGroupTiebreaker(98, 102, 100)).toBeLessThan(0);
  });

  it("equidistant: higher prediction loses — a=102, b=98, actual=100 → b wins", () => {
    expect(compareGroupTiebreaker(102, 98, 100)).toBeGreaterThan(0);
  });

  it("identical predictions = tie (0)", () => {
    expect(compareGroupTiebreaker(100, 100, 100)).toBe(0);
  });

  it("exact prediction vs off-by-10: exact wins", () => {
    expect(compareGroupTiebreaker(100, 110, 100)).toBeLessThan(0);
  });

  it("both over: closer one wins", () => {
    expect(compareGroupTiebreaker(101, 120, 100)).toBeLessThan(0);
  });
});
