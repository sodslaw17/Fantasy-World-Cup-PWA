// Pure group-stage scoring functions — no I/O, fully unit-testable.

type Outcome = "home" | "away" | "draw";

function matchOutcome(homeGoals: number, awayGoals: number): Outcome {
  if (homeGoals > awayGoals) return "home";
  if (awayGoals > homeGoals) return "away";
  return "draw";
}

export interface MatchResult {
  home_goals: number;
  away_goals: number;
}

export interface MatchPrediction {
  home_goals_pred: number;
  away_goals_pred: number;
}

/**
 * Points for a single group-stage prediction.
 * +3 = exact score (goals match both teams correctly)
 * +2 = correct outcome only (win / loss / draw)
 * +0 = wrong outcome
 * An exact score always implies a correct outcome, so max per match = 3.
 */
export function scoreGroupMatch(
  result: MatchResult,
  pred: MatchPrediction
): 0 | 2 | 3 {
  const exact =
    result.home_goals === pred.home_goals_pred &&
    result.away_goals === pred.away_goals_pred;

  if (exact) return 3;

  if (
    matchOutcome(result.home_goals, result.away_goals) ===
    matchOutcome(pred.home_goals_pred, pred.away_goals_pred)
  ) {
    return 2;
  }

  return 0;
}

/**
 * Total group-stage points for a user across a list of result/prediction pairs.
 * Only pairs where a result is available are counted.
 */
export function totalGroupPoints(
  pairs: Array<{ result: MatchResult; pred: MatchPrediction }>
): number {
  return pairs.reduce(
    (sum, { result, pred }) => sum + scoreGroupMatch(result, pred),
    0
  );
}

/**
 * Sum of all predicted goals across all group matches.
 * Used as the group-stage tiebreaker metric.
 */
export function sumPredictedGoals(preds: MatchPrediction[]): number {
  return preds.reduce(
    (sum, p) => sum + p.home_goals_pred + p.away_goals_pred,
    0
  );
}

/**
 * Compare two users for group-stage leaderboard tiebreaker ordering.
 * Inputs: each user's total predicted goals across all 72 matches, and the
 *         actual total goals across all finished group-stage matches.
 *
 * Returns negative  → a ranks higher (closer to actual, or lower prediction if equidistant)
 * Returns positive  → b ranks higher
 * Returns 0         → tied
 */
export function compareGroupTiebreaker(
  aPredictedTotal: number,
  bPredictedTotal: number,
  actualTotal: number
): number {
  const aError = Math.abs(aPredictedTotal - actualTotal);
  const bError = Math.abs(bPredictedTotal - actualTotal);
  if (aError !== bError) return aError - bError;     // lower absolute error wins
  return aPredictedTotal - bPredictedTotal;          // lower prediction wins ties
}
