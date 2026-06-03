// Pure leaderboard computation — no I/O, fully unit-testable.
import { scoreGroupMatch, compareGroupTiebreaker } from "./group";

export interface LeaderboardEntry {
  profileId: string;
  authId: string | null;
  displayName: string;
  points: number;
  predictedGoals: number; // total predicted goals across ALL group matches (tiebreaker metric)
  rank: number;
  predictionCount: number; // how many matches they've predicted
}

interface MatchRow {
  id: string;
  home_goals: number | null;
  away_goals: number | null;
  status: string;
}

interface PredRow {
  user_id: string;
  match_id: string;
  home_goals_pred: number;
  away_goals_pred: number;
}

interface ProfileRow {
  id: string;
  auth_id: string | null;
  display_name: string;
}

/**
 * Compute the ranked group-stage leaderboard from raw DB rows.
 * Only users who have logged in at least once (auth_id is set) appear.
 */
export function computeLeaderboard(
  profiles: ProfileRow[],
  matches: MatchRow[],
  predictions: PredRow[]
): LeaderboardEntry[] {
  const finishedMatches = matches.filter(
    (m) => m.status === "finished" && m.home_goals !== null && m.away_goals !== null
  );

  const actualGoals = finishedMatches.reduce(
    (sum, m) => sum + (m.home_goals ?? 0) + (m.away_goals ?? 0),
    0
  );

  // Index predictions by userId → matchId
  const byUser: Record<string, Record<string, PredRow>> = {};
  for (const p of predictions) {
    (byUser[p.user_id] ??= {})[p.match_id] = p;
  }

  const entries: Omit<LeaderboardEntry, "rank">[] = profiles
    .filter((p) => p.auth_id !== null)
    .map((profile) => {
      const userPreds = byUser[profile.auth_id!] ?? {};

      // Points: only finished matches where the user submitted a prediction
      const points = finishedMatches.reduce((sum, m) => {
        const pred = userPreds[m.id];
        if (!pred) return sum;
        return (
          sum +
          scoreGroupMatch(
            { home_goals: m.home_goals!, away_goals: m.away_goals! },
            { home_goals_pred: pred.home_goals_pred, away_goals_pred: pred.away_goals_pred }
          )
        );
      }, 0);

      // Predicted goals: sum across ALL group predictions (used for tiebreaker)
      const predictedGoals = Object.values(userPreds).reduce(
        (sum, p) => sum + p.home_goals_pred + p.away_goals_pred,
        0
      );

      return {
        profileId: profile.id,
        authId: profile.auth_id,
        displayName: profile.display_name,
        points,
        predictedGoals,
        predictionCount: Object.keys(userPreds).length,
      };
    });

  // Sort: points desc → tiebreaker (lower error, then lower predicted total)
  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return compareGroupTiebreaker(a.predictedGoals, b.predictedGoals, actualGoals);
  });

  // Standard competition ranking (1, 2, 2, 4 …)
  let currentRank = 1;
  return entries.map((entry, i) => {
    if (i > 0) {
      const prev = entries[i - 1];
      const tied =
        entry.points === prev.points &&
        compareGroupTiebreaker(entry.predictedGoals, prev.predictedGoals, actualGoals) === 0;
      if (!tied) currentRank = i + 1;
    }
    return { ...entry, rank: currentRank };
  });
}
