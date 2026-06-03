// Pure side-pot scoring functions — no I/O, fully unit-testable.

// ── 1st Side Pot: Efficiency ─────────────────────────────────────────────────

/**
 * Efficiency metric: (goals + assists) / minutes played.
 * Returns 0 for 0 minutes (confirmed rule §H — no division by zero error).
 */
export function computeEfficiency(
  goals: number,
  assists: number,
  minutes: number
): number {
  if (minutes <= 0) return 0;
  return (goals + assists) / minutes;
}

export interface EfficiencyInput {
  profileId: string;
  displayName: string;
  playerName: string;
  teamCode: string | null;
  goals: number;
  assists: number;
  minutes: number;
}

export interface EfficiencyEntry extends EfficiencyInput {
  efficiency: number;
  rank: number;
}

/** Rank all users by their chosen footballer's efficiency (highest wins). */
export function computeEfficiencyLeaderboard(
  picks: EfficiencyInput[]
): EfficiencyEntry[] {
  const scored = picks
    .map((p) => ({ ...p, efficiency: computeEfficiency(p.goals, p.assists, p.minutes) }))
    .sort((a, b) => b.efficiency - a.efficiency);

  let currentRank = 1;
  return scored.map((entry, i) => {
    if (i > 0 && Math.abs(entry.efficiency - scored[i - 1].efficiency) > 1e-10) {
      currentRank = i + 1;
    }
    return { ...entry, rank: currentRank };
  });
}

// ── 2nd Side Pot: Discipline ─────────────────────────────────────────────────

/**
 * Card points for one team in one match.
 * 1st yellow = 1, 2nd yellow (two-yellow red) = 2, straight red = 4.
 */
export function computeCardPoints(
  yellows: number,
  secondYellows: number,
  straightReds: number
): number {
  return yellows * 1 + secondYellows * 2 + straightReds * 4;
}

export interface DisciplineEntry {
  profileId: string;
  displayName: string;
  teamCodes: string[];
  totalCardPoints: number;
  rank: number;
}

/**
 * Rank all users by total card points across their 3 drafted teams.
 * Highest card points = worst discipline = wins the 2nd side pot.
 */
export function computeDisciplineLeaderboard(
  profiles: Array<{ id: string; display_name: string; auth_id: string | null }>,
  drafts: Array<{ profile_id: string; team_code: string }>,
  matchStats: Array<{
    team_code: string;
    yellows: number;
    second_yellows: number;
    straight_reds: number;
  }>
): DisciplineEntry[] {
  const draftByProfile: Record<string, string[]> = {};
  for (const d of drafts) {
    (draftByProfile[d.profile_id] ??= []).push(d.team_code);
  }

  const entries = profiles
    .filter((p) => p.auth_id !== null)
    .map((p) => {
      const teamCodes = draftByProfile[p.id] ?? [];
      const totalCardPoints = matchStats
        .filter((ms) => teamCodes.includes(ms.team_code))
        .reduce(
          (sum, ms) =>
            sum + computeCardPoints(ms.yellows, ms.second_yellows, ms.straight_reds),
          0
        );
      return { profileId: p.id, displayName: p.display_name, teamCodes, totalCardPoints };
    })
    .sort((a, b) => b.totalCardPoints - a.totalCardPoints);

  let currentRank = 1;
  return entries.map((entry, i) => {
    if (i > 0 && entry.totalCardPoints !== entries[i - 1].totalCardPoints) {
      currentRank = i + 1;
    }
    return { ...entry, rank: currentRank };
  });
}
