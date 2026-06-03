// Pure knockout scoring functions — no I/O, fully unit-testable.

export type PenaltyEventType = "off_target" | "panenka_fail" | "panenka_score";
export type KnockoutStage = "r32" | "r16" | "qf" | "sf" | "bronze" | "final";

export interface KnockoutMatch {
  id: string;
  stage: KnockoutStage;
  home_team_code: string | null;
  away_team_code: string | null;
  home_goals: number;   // open-play + ET; never includes post-ET shootout goals
  away_goals: number;
  went_to_shootout: boolean;
  shootout_winner: "home" | "away" | null;
  status: string;
}

export interface PenaltyEvent {
  match_id: string;
  team_code: string;
  type: PenaltyEventType;
}

/**
 * Points earned by the drafter of `teamCode` for one knockout match.
 *
 * Rules (§5.4):
 *   +2  team wins the game (any round except bronze)
 *   +1  team wins the bronze final
 *   +1  team loses a penalty shootout (not applicable in bronze — confirmed rule)
 *   +0  team loses in open play / ET
 *   +(goals scored, excl. post-ET shootout goals)
 */
export function scoreKnockoutMatch(match: KnockoutMatch, teamCode: string): number {
  const isHome = match.home_team_code === teamCode;
  const isAway = match.away_team_code === teamCode;
  if (!isHome && !isAway) return 0;

  const isBronze = match.stage === "bronze";
  const goalsFor = isHome ? match.home_goals : match.away_goals;

  const wonInPlay = isHome
    ? match.home_goals > match.away_goals
    : match.away_goals > match.home_goals;

  const wonOnPens =
    match.went_to_shootout &&
    ((isHome && match.shootout_winner === "home") ||
      (isAway && match.shootout_winner === "away"));

  const lostOnPens =
    match.went_to_shootout &&
    ((isHome && match.shootout_winner === "away") ||
      (isAway && match.shootout_winner === "home"));

  const won = wonInPlay || wonOnPens;

  let pts = 0;
  if (won) pts += isBronze ? 1 : 2;          // win bonus (§5.3 bronze rule)
  if (!isBronze && lostOnPens) pts += 1;      // pen-loss bonus (not in bronze)
  pts += goalsFor;                             // goals (open play + ET only)

  return pts;
}

/**
 * Points from a single penalty-shootout event attributed to the drafter.
 * −1 off-target, −1 Panenka fail, +1 Panenka score.
 */
export function scorePenaltyEvent(type: PenaltyEventType): number {
  return type === "panenka_score" ? 1 : -1;
}

/**
 * Total knockout points for a user across all their drafted teams.
 */
export function totalKnockoutPoints(
  draftedTeamCodes: string[],
  finishedKnockoutMatches: KnockoutMatch[],
  penaltyEvents: PenaltyEvent[]
): number {
  const matchPts = finishedKnockoutMatches.reduce((sum, m) => {
    return (
      sum +
      draftedTeamCodes.reduce((s, code) => s + scoreKnockoutMatch(m, code), 0)
    );
  }, 0);

  const penPts = penaltyEvents
    .filter((e) => draftedTeamCodes.includes(e.team_code))
    .reduce((sum, e) => sum + scorePenaltyEvent(e.type), 0);

  return matchPts + penPts;
}

/**
 * Goal difference for one team across all its finished knockout matches.
 * GD = Σ(goals for − goals against).
 */
export function teamKnockoutGD(
  finishedMatches: KnockoutMatch[],
  teamCode: string
): number {
  return finishedMatches.reduce((sum, m) => {
    const isHome = m.home_team_code === teamCode;
    const isAway = m.away_team_code === teamCode;
    if (!isHome && !isAway) return sum;
    const gf = isHome ? m.home_goals : m.away_goals;
    const ga = isHome ? m.away_goals : m.home_goals;
    return sum + gf - ga;
  }, 0);
}

/**
 * Combined knockout GD across all of a user's drafted teams (overall tiebreaker).
 */
export function draftedTeamsGD(
  finishedMatches: KnockoutMatch[],
  draftedTeamCodes: string[]
): number {
  return draftedTeamCodes.reduce(
    (sum, code) => sum + teamKnockoutGD(finishedMatches, code),
    0
  );
}
