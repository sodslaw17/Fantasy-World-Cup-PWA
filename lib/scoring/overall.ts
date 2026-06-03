// Overall (combined group + knockout) leaderboard computation.
import { computeLeaderboard, type LeaderboardEntry } from "./leaderboard";
import {
  totalKnockoutPoints,
  draftedTeamsGD,
  type KnockoutMatch,
  type PenaltyEvent,
} from "./knockout";

export interface OverallEntry {
  profileId: string;
  authId: string | null;
  displayName: string;
  groupPoints: number;
  knockoutPoints: number;
  totalPoints: number;
  goalDifference: number; // combined GD of 3 drafted teams — overall tiebreaker
  rank: number;
}

interface DraftRow {
  profile_id: string;
  team_code: string; // fifa_code, joined from teams table
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
 * Compute the overall ranked leaderboard (group + knockout combined).
 *
 * Overall tiebreaker: combined knockout goal difference of the user's
 * 3 drafted teams (higher is better). Per §5.4 and §12.
 */
export function computeOverallLeaderboard(
  profiles: ProfileRow[],
  groupMatches: MatchRow[],
  groupPredictions: PredRow[],
  drafts: DraftRow[],
  knockoutMatches: KnockoutMatch[],
  penaltyEvents: PenaltyEvent[]
): OverallEntry[] {
  // Group points via existing leaderboard fn
  const groupBoard = computeLeaderboard(
    profiles,
    groupMatches,
    groupPredictions
  );

  const groupPtsById: Record<string, number> = Object.fromEntries(
    groupBoard.map((e) => [e.profileId, e.points])
  );

  // Finished knockout matches only
  const finishedKO = knockoutMatches.filter((m) => m.status === "finished");

  // Draft map: profileId → [teamCode, teamCode, teamCode]
  const draftByProfile: Record<string, string[]> = {};
  for (const d of drafts) {
    (draftByProfile[d.profile_id] ??= []).push(d.team_code);
  }

  const entries: Omit<OverallEntry, "rank">[] = profiles
    .filter((p) => p.auth_id !== null)
    .map((profile) => {
      const groupPts = groupPtsById[profile.id] ?? 0;
      const teams = draftByProfile[profile.id] ?? [];

      const knockoutPts = totalKnockoutPoints(teams, finishedKO, penaltyEvents);
      const gd = draftedTeamsGD(finishedKO, teams);

      return {
        profileId: profile.id,
        authId: profile.auth_id,
        displayName: profile.display_name,
        groupPoints: groupPts,
        knockoutPoints: knockoutPts,
        totalPoints: groupPts + knockoutPts,
        goalDifference: gd,
      };
    });

  // Sort: total desc → GD desc (higher is better)
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.goalDifference - a.goalDifference;
  });

  // Standard competition ranking
  let currentRank = 1;
  return entries.map((entry, i) => {
    if (i > 0) {
      const prev = entries[i - 1];
      const tied =
        entry.totalPoints === prev.totalPoints &&
        entry.goalDifference === prev.goalDifference;
      if (!tied) currentRank = i + 1;
    }
    return { ...entry, rank: currentRank };
  });
}

/** Re-export so callers only need to import from overall.ts */
export type { LeaderboardEntry };
export { computeLeaderboard };
