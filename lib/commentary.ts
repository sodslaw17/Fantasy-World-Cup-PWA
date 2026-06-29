// Pure functions for building AI commentary prompts.
// No I/O here — all data fetching and Claude calls live in app/today/actions.ts.
import { scoreKnockoutMatch, type KnockoutMatch } from "@/lib/scoring/knockout";
import type { OverallEntry } from "@/lib/scoring/overall";

export type CommentaryType = "pregame" | "postgame";

export interface DrafterInvolvement {
  profileId: string;
  displayName: string;
  teamCode: string;
  teamName: string;
  side: "home" | "away";
  overallRank: number;
  overallPoints: number;
  winBonus: number;       // +2 non-bronze, +1 bronze
  penLossBonus: number;   // +1 non-bronze, 0 bronze
  pointsEarned?: number;  // only set for finished matches
}

export interface EffPickInGame {
  profileId: string;
  displayName: string;
  playerName: string;
  teamCode: string;
  teamName: string;
  side: "home" | "away";
}

export interface CardStat {
  teamCode: string;
  teamName: string;
  yellows: number;
  secondYellows: number;
  straightReds: number;
}

export function buildInvolvement(
  homeCode: string | null,
  awayCode: string | null,
  stage: string,
  finishedMatch: KnockoutMatch | null,
  draftsByTeam: Record<string, { profileId: string; displayName: string }>,
  standings: OverallEntry[],
  teamNames: Record<string, string>,
): DrafterInvolvement[] {
  const isBronze = stage === "bronze";
  const winBonus = isBronze ? 1 : 2;
  const penLossBonus = isBronze ? 0 : 1;
  const result: DrafterInvolvement[] = [];

  for (const [side, code] of [["home", homeCode], ["away", awayCode]] as const) {
    if (!code) continue;
    const drafter = draftsByTeam[code];
    if (!drafter) continue;
    const standing = standings.find((s) => s.profileId === drafter.profileId);
    const pointsEarned = finishedMatch ? scoreKnockoutMatch(finishedMatch, code) : undefined;
    result.push({
      profileId: drafter.profileId,
      displayName: drafter.displayName,
      teamCode: code,
      teamName: teamNames[code] ?? code,
      side: side as "home" | "away",
      overallRank: standing?.rank ?? 0,
      overallPoints: standing?.totalPoints ?? 0,
      winBonus,
      penLossBonus,
      pointsEarned,
    });
  }
  return result;
}

export function buildEffPicksInGame(
  homeCode: string | null,
  awayCode: string | null,
  effPicks: Array<{ profileId: string; displayName: string; playerName: string; teamCode: string | null }>,
  teamNames: Record<string, string>,
): EffPickInGame[] {
  const result: EffPickInGame[] = [];
  for (const pick of effPicks) {
    if (!pick.teamCode) continue;
    if (pick.teamCode === homeCode || pick.teamCode === awayCode) {
      result.push({
        profileId: pick.profileId,
        displayName: pick.displayName,
        playerName: pick.playerName,
        teamCode: pick.teamCode,
        teamName: teamNames[pick.teamCode] ?? pick.teamCode,
        side: pick.teamCode === homeCode ? "home" : "away",
      });
    }
  }
  return result;
}

export const SYSTEM_PROMPT =
  "You are the voice of a WC2026 fantasy football pool — casual, fun, lightly sarcastic, and hyperbolic. " +
  "Write ONLY from the facts in the prompt. Do NOT invent scores, goals, cards, players, goalscorers, or any stat. " +
  "The data table is the source of truth; your prose adds flavor and never contradicts it. " +
  "Respond with 2–3 punchy sentences only. No headers, no bullet points.";

export function buildPreGamePrompt(
  homeTeamName: string,
  awayTeamName: string,
  stage: string,
  kickoffUtc: string,
  involvement: DrafterInvolvement[],
  effPicksInGame: EffPickInGame[],
  standings: OverallEntry[],
): string {
  const kickoffStr = new Date(kickoffUtc).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  const stakeLines =
    involvement.length > 0
      ? involvement
          .map(
            (inv) =>
              `- ${inv.displayName} drafted ${inv.teamName} (currently #${inv.overallRank}, ${inv.overallPoints} pts). ` +
              `Win earns: +${inv.winBonus} bonus + open-play goals scored.` +
              (inv.penLossBonus > 0 ? ` Penalty loss: +${inv.penLossBonus} pt.` : ""),
          )
          .join("\n")
      : "- No pool members drafted either team.";

  const effLines =
    effPicksInGame.length > 0
      ? effPicksInGame
          .map((ep) => `- ${ep.displayName}'s pick: ${ep.playerName} plays for ${ep.teamName}.`)
          .join("\n")
      : "None";

  const topFive = standings
    .slice(0, 5)
    .map((s) => `  ${s.rank}. ${s.displayName} — ${s.totalPoints} pts`)
    .join("\n");

  return [
    `UPCOMING MATCH: ${homeTeamName} vs ${awayTeamName} (${stage.toUpperCase()}, ${kickoffStr} UTC)`,
    "",
    "WHO HAS SKIN IN THIS GAME:",
    stakeLines,
    "",
    "EFFICIENCY PICKS PLAYING IN THIS MATCH:",
    effLines,
    "",
    "CURRENT OVERALL STANDINGS (top 5):",
    topFive,
    "",
    "TASK: Write a pre-game stakes summary (2–3 sentences). Highlight pool drama — who's dueling whom, what winning or losing means for the standings, and any efficiency-pick subplot. Casual, fun, hyperbolic.",
  ].join("\n");
}

export function buildPostGamePrompt(
  homeTeamName: string,
  awayTeamName: string,
  stage: string,
  homeGoals: number,
  awayGoals: number,
  wentToShootout: boolean,
  shootoutWinner: string | null,
  involvement: DrafterInvolvement[],
  effPicksInGame: EffPickInGame[],
  standings: OverallEntry[],
  cardStats: CardStat[],
): string {
  const shootoutNote = wentToShootout
    ? ` (penalties — ${shootoutWinner === "home" ? homeTeamName : awayTeamName} won on pens)`
    : "";

  const stakeLines =
    involvement.length > 0
      ? involvement
          .map(
            (inv) =>
              `- ${inv.displayName} (${inv.teamName}): earned +${inv.pointsEarned ?? 0} pts this match. ` +
              `Now #${inv.overallRank} with ${inv.overallPoints} pts overall.`,
          )
          .join("\n")
      : "- No pool members had skin in this game.";

  const effLines =
    effPicksInGame.length > 0
      ? effPicksInGame
          .map((ep) => `- ${ep.displayName}'s pick: ${ep.playerName} played for ${ep.teamName}.`)
          .join("\n")
      : "None";

  const cardLines =
    cardStats.length > 0
      ? cardStats
          .map((cs) => {
            const parts: string[] = [];
            if (cs.yellows > 0) parts.push(`${cs.yellows} yellow${cs.yellows > 1 ? "s" : ""}`);
            if (cs.secondYellows > 0) parts.push(`${cs.secondYellows} second-yellow red${cs.secondYellows > 1 ? "s" : ""}`);
            if (cs.straightReds > 0) parts.push(`${cs.straightReds} straight red${cs.straightReds > 1 ? "s" : ""}`);
            return parts.length > 0 ? `- ${cs.teamName}: ${parts.join(", ")}` : null;
          })
          .filter(Boolean)
          .join("\n") || "None"
      : "None";

  const topFive = standings
    .slice(0, 5)
    .map((s) => `  ${s.rank}. ${s.displayName} — ${s.totalPoints} pts`)
    .join("\n");

  return [
    `RESULT: ${homeTeamName} ${homeGoals}–${awayGoals} ${awayTeamName} (${stage.toUpperCase()}, FULL TIME${shootoutNote})`,
    "",
    "POINTS EARNED THIS MATCH (from scoring engine):",
    stakeLines,
    "",
    "EFFICIENCY PICKS IN THIS GAME:",
    effLines,
    "",
    "CARDS (team totals, from match stats):",
    cardLines,
    "",
    "STANDINGS AFTER THIS RESULT (top 5):",
    topFive,
    "",
    "TASK: Write a post-game recap (2–3 sentences). Comment on the result, what it means for the pool standings, and any card carnage or efficiency-pick subplot. If a goalless game went to penalties, capture the wild tension of a 0–0 shootout. Casual, fun, lightly sarcastic.",
  ].join("\n");
}
