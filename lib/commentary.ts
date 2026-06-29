// Pure functions for building AI commentary prompts.
// ALL numbers passed to the AI are computed here in code — the model never calculates anything.
// No I/O in this file. All DB fetching and API calls live in app/today/actions.ts.

import { scoreKnockoutMatch, type KnockoutMatch } from "@/lib/scoring/knockout";
import type { OverallEntry } from "@/lib/scoring/overall";
import type { EfficiencyEntry, DisciplineEntry } from "@/lib/scoring/sidepots";
import type { SassLevel } from "@/lib/db";

export type { SassLevel };
export type CommentaryType = "pregame" | "postgame";

// ─── Context interfaces ────────────────────────────────────────────────────────

export interface EffPickContext {
  playerName: string;
  currentGoals: number;
  currentAssists: number;
  currentMinutes: number;
  currentEfficiency: number;    // 4 decimal places
  effRank: number;
  gapToEffLeader: number | null; // null = IS leader
  effLeaderName: string | null;

  // Pre-game: what different 90-min performances would do
  scoreless90:      EffScenario;
  oneGoal90:        EffScenario;
  oneAssist90:      EffScenario;
  oneGoalOneAssist90: EffScenario;
  twoGoals90:       EffScenario;
}

export interface EffScenario {
  newGoals: number;
  newAssists: number;
  newMinutes: number;
  newEfficiency: number;
  change: number;
  dir: "UP" | "DOWN" | "SAME"; // ← AI must use this; NEVER infer direction itself
}

export interface DiscPickContext {
  currentCardPts: number;
  discRank: number;             // 1 = worst discipline (most card pts)
  isWorstDiscipline: boolean;
  gapToWorst: number | null;    // null = IS worst
  worstName: string | null;
  afterYellow:      { newPts: number; newRank: number };
  afterStraightRed: { newPts: number; newRank: number };
}

export interface UserMatchContext {
  profileId: string;
  displayName: string;
  nickname: string | null;
  teamCode: string;
  teamName: string;
  teamNickname: string | null;
  side: "home" | "away";

  // Current standing
  currentRank: number;
  currentPoints: number;
  aboveRank: number | null;
  aboveName: string | null;
  abovePts: number | null;
  belowRank: number | null;
  belowName: string | null;
  belowPts: number | null;
  gapAbove: number | null;  // pts they are behind the user above them
  gapBelow: number | null;  // pts they are ahead of the user below them
  gapToFirst: number | null;
  firstName: string | null;
  firstPts: number | null;

  // Win/loss outcome parameters
  winBonus: number;
  penLossBonus: number;

  // Computed rank outcomes (computed, never inferred by AI)
  rankAfterWin0Goals: number;
  rankAfterWin1Goal: number;
  rankAfterWin2Goals: number;
  rankAfterWin3Goals: number;
  ptsAfterWin0Goals: number;
  ptsAfterWin1Goal: number;
  ptsAfterWin2Goals: number;
  ptsAfterWin3Goals: number;
  rankAfterPenLoss: number;
  ptsAfterPenLoss: number;

  // Goals needed to overtake the user directly above (null = already #1 or not applicable)
  goalsToOvertakeAbove: number | null;

  // Side-pot contexts
  effPick?: EffPickContext;
  discPick?: DiscPickContext;

  // Post-game only
  pointsEarnedThisMatch?: number;
}

export interface MatchContext {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  stage: string;
  kickoffUtc: string;
  sassLevel: SassLevel;
  users: UserMatchContext[];
  allStandings: { rank: number; displayName: string; nickname: string | null; totalPoints: number }[];

  // Post-game only
  result?: {
    homeGoals: number;
    awayGoals: number;
    wentToShootout: boolean;
    penWinner: string | null;
    homeCardPts: number;
    awayCardPts: number;
    homeYellows: number;
    homeRedCards: number;
    awayYellows: number;
    awayRedCards: number;
  };
}

// ─── Stage labels ──────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  r32: "Round of 32", r16: "Round of 16", qf: "Quarter-Final",
  sf: "Semi-Final", bronze: "3rd-Place Match", final: "Final",
};

// ─── Computation helpers ───────────────────────────────────────────────────────

function fmt4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function rankAfterPoints(
  standings: OverallEntry[],
  profileId: string,
  addedPts: number,
): number {
  const my = standings.find((s) => s.profileId === profileId)!;
  const newTotal = my.totalPoints + addedPts;
  // Count non-me users who strictly have more points (GD excluded for hypothetical scenarios)
  const ahead = standings.filter(
    (s) => s.profileId !== profileId && s.totalPoints > newTotal,
  ).length;
  return ahead + 1;
}

function discRankAfter(
  leaderboard: DisciplineEntry[],
  profileId: string,
  addedPts: number,
): number {
  const my = leaderboard.find((d) => d.profileId === profileId)!;
  const newTotal = my.totalCardPoints + addedPts;
  const ahead = leaderboard.filter(
    (d) => d.profileId !== profileId && d.totalCardPoints > newTotal,
  ).length;
  return ahead + 1;
}

// ─── Build UserMatchContext ────────────────────────────────────────────────────

export function buildUserMatchContext(params: {
  profileId: string;
  displayName: string;
  nickname: string | null;
  teamCode: string;
  teamName: string;
  teamNickname: string | null;
  side: "home" | "away";
  stage: string;
  standings: OverallEntry[];
  effEntry: (EfficiencyEntry & { gapToLeader: number | null; leaderName: string | null }) | null;
  discEntry: DisciplineEntry | null;
  discLeaderboard: DisciplineEntry[];
  finishedMatch: KnockoutMatch | null;
}): UserMatchContext {
  const { profileId, displayName, nickname, teamCode, teamName, teamNickname, side, stage } = params;
  const { standings, effEntry, discEntry, discLeaderboard, finishedMatch } = params;

  const isBronze = stage === "bronze";
  const winBonus = isBronze ? 1 : 2;
  const penLossBonus = isBronze ? 0 : 1;

  const myEntry = standings.find((s) => s.profileId === profileId)!;
  const myIdx = standings.indexOf(myEntry);
  const above = myIdx > 0 ? standings[myIdx - 1] : null;
  const below = myIdx < standings.length - 1 ? standings[myIdx + 1] : null;
  const first = standings[0];

  const gapAbove = above ? above.totalPoints - myEntry.totalPoints : null;
  const goalsToOvertakeAbove =
    above && gapAbove !== null
      ? Math.max(0, gapAbove - winBonus + 1)  // need winBonus+goals > gapAbove
      : null;

  const pointsEarned = finishedMatch ? scoreKnockoutMatch(finishedMatch, teamCode) : undefined;

  // Efficiency context
  let effPick: EffPickContext | undefined;
  if (effEntry) {
    const ep = effEntry;
    function effScenario(extraG: number, extraA: number): EffScenario {
      const newG = ep.goals + extraG;
      const newA = ep.assists + extraA;
      const newM = ep.minutes + 90;
      const newEff = newM > 0 ? (newG + newA) / newM : 0;
      const change = fmt4(newEff - ep.efficiency);
      return {
        newGoals: newG,
        newAssists: newA,
        newMinutes: newM,
        newEfficiency: fmt4(newEff),
        change,
        dir: change > 0.00001 ? "UP" : change < -0.00001 ? "DOWN" : "SAME",
      };
    }
    effPick = {
      playerName: ep.playerName,
      currentGoals: ep.goals,
      currentAssists: ep.assists,
      currentMinutes: ep.minutes,
      currentEfficiency: fmt4(ep.efficiency),
      effRank: ep.rank,
      gapToEffLeader: ep.gapToLeader,
      effLeaderName: ep.leaderName,
      scoreless90:         effScenario(0, 0),
      oneGoal90:           effScenario(1, 0),
      oneAssist90:         effScenario(0, 1),
      oneGoalOneAssist90:  effScenario(1, 1),
      twoGoals90:          effScenario(2, 0),
    };
  }

  // Discipline context
  let discPick: DiscPickContext | undefined;
  if (discEntry) {
    const de = discEntry;
    const leader = discLeaderboard[0];
    discPick = {
      currentCardPts: de.totalCardPoints,
      discRank: de.rank,
      isWorstDiscipline: de.rank === 1,
      gapToWorst: de.rank === 1 ? null : leader.totalCardPoints - de.totalCardPoints,
      worstName: de.rank === 1 ? null : leader.displayName,
      afterYellow:      { newPts: de.totalCardPoints + 1, newRank: discRankAfter(discLeaderboard, profileId, 1) },
      afterStraightRed: { newPts: de.totalCardPoints + 4, newRank: discRankAfter(discLeaderboard, profileId, 4) },
    };
  }

  return {
    profileId, displayName, nickname, teamCode, teamName, teamNickname, side,
    currentRank: myEntry.rank,
    currentPoints: myEntry.totalPoints,
    aboveRank: above?.rank ?? null,
    aboveName: above?.displayName ?? null,
    abovePts: above?.totalPoints ?? null,
    belowRank: below?.rank ?? null,
    belowName: below?.displayName ?? null,
    belowPts: below?.totalPoints ?? null,
    gapAbove,
    gapBelow: below ? myEntry.totalPoints - below.totalPoints : null,
    gapToFirst: myEntry.rank > 1 ? first.totalPoints - myEntry.totalPoints : null,
    firstName: myEntry.rank > 1 ? first.displayName : null,
    firstPts: myEntry.rank > 1 ? first.totalPoints : null,
    winBonus,
    penLossBonus,
    rankAfterWin0Goals: rankAfterPoints(standings, profileId, winBonus),
    rankAfterWin1Goal:  rankAfterPoints(standings, profileId, winBonus + 1),
    rankAfterWin2Goals: rankAfterPoints(standings, profileId, winBonus + 2),
    rankAfterWin3Goals: rankAfterPoints(standings, profileId, winBonus + 3),
    ptsAfterWin0Goals:  myEntry.totalPoints + winBonus,
    ptsAfterWin1Goal:   myEntry.totalPoints + winBonus + 1,
    ptsAfterWin2Goals:  myEntry.totalPoints + winBonus + 2,
    ptsAfterWin3Goals:  myEntry.totalPoints + winBonus + 3,
    rankAfterPenLoss:   rankAfterPoints(standings, profileId, penLossBonus),
    ptsAfterPenLoss:    myEntry.totalPoints + penLossBonus,
    goalsToOvertakeAbove,
    effPick,
    discPick,
    pointsEarnedThisMatch: pointsEarned,
  };
}

// ─── Context text builder ──────────────────────────────────────────────────────
// Produces a human-readable structured document. Every fact the AI can use is here.

export function buildContextText(ctx: MatchContext, type: CommentaryType): string {
  const stageLabel = STAGE_LABELS[ctx.stage] ?? ctx.stage.toUpperCase();
  const kickoffStr = new Date(ctx.kickoffUtc).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short",
  });

  const lines: string[] = [
    `=== ${type === "pregame" ? "PRE-GAME" : "POST-GAME"} CONTEXT ===`,
    `Match: ${ctx.homeTeamName} vs ${ctx.awayTeamName} | ${stageLabel}`,
    `Kickoff: ${kickoffStr}`,
    `Requested tone: ${ctx.sassLevel.toUpperCase()}`,
    "",
  ];

  if (type === "postgame" && ctx.result) {
    const r = ctx.result;
    const winner =
      r.wentToShootout
        ? `${r.penWinner === "home" ? ctx.homeTeamName : ctx.awayTeamName} won on pens`
        : r.homeGoals > r.awayGoals
        ? `${ctx.homeTeamName} won`
        : r.awayGoals > r.homeGoals
        ? `${ctx.awayTeamName} won`
        : "Draw";
    lines.push(
      `RESULT: ${ctx.homeTeamName} ${r.homeGoals}–${r.awayGoals} ${ctx.awayTeamName}${r.wentToShootout ? " AET (pens)" : ""}`,
      `Outcome: ${winner}`,
    );
    const totalCards = r.homeYellows + r.homeRedCards + r.awayYellows + r.awayRedCards;
    if (totalCards > 0) {
      lines.push("Cards this match:");
      if (r.homeYellows || r.homeRedCards) {
        lines.push(`  ${ctx.homeTeamName}: ${r.homeYellows} yellow(s), ${r.homeRedCards} red(s) → ${r.homeCardPts} card pts`);
      }
      if (r.awayYellows || r.awayRedCards) {
        lines.push(`  ${ctx.awayTeamName}: ${r.awayYellows} yellow(s), ${r.awayRedCards} red(s) → ${r.awayCardPts} card pts`);
      }
    }
    lines.push("");
  }

  for (const u of ctx.users) {
    const nameStr = u.nickname ? `${u.displayName} ("${u.nickname}")` : u.displayName;
    const teamStr = u.teamNickname ? `${u.teamName} ("${u.teamNickname}")` : u.teamName;
    lines.push(`── ${nameStr} — drafted ${teamStr} [${u.side}] ──`);
    lines.push(`Standing: #${u.currentRank}, ${u.currentPoints}pts`);

    if (u.gapAbove !== null && u.aboveName) {
      lines.push(`  ${u.gapAbove}pts behind #${u.aboveRank} ${u.aboveName} (${u.abovePts}pts)`);
    }
    if (u.currentRank > 2 && u.gapToFirst !== null) {
      lines.push(`  ${u.gapToFirst}pts behind leader #1 ${u.firstName} (${u.firstPts}pts)`);
    }
    if (u.gapBelow !== null && u.belowName) {
      lines.push(`  ${u.gapBelow}pts ahead of #${u.belowRank} ${u.belowName} (${u.belowPts}pts)`);
    }

    if (type === "pregame") {
      lines.push(
        "Match outcome scenarios:",
        `  Win + 0 goals: +${u.winBonus}pts → ${u.ptsAfterWin0Goals}pts → #${u.rankAfterWin0Goals}`,
        `  Win + 1 goal:  +${u.winBonus + 1}pts → ${u.ptsAfterWin1Goal}pts → #${u.rankAfterWin1Goal}`,
        `  Win + 2 goals: +${u.winBonus + 2}pts → ${u.ptsAfterWin2Goals}pts → #${u.rankAfterWin2Goals}`,
        `  Win + 3 goals: +${u.winBonus + 3}pts → ${u.ptsAfterWin3Goals}pts → #${u.rankAfterWin3Goals}`,
      );
      if (u.goalsToOvertakeAbove !== null && u.aboveName) {
        if (u.goalsToOvertakeAbove === 0) {
          lines.push(`  ← Even a scoreless win puts them past ${u.aboveName}`);
        } else {
          lines.push(`  ← Needs ≥${u.goalsToOvertakeAbove} goal(s) from a win to overtake ${u.aboveName}`);
        }
      }
      if (u.penLossBonus > 0) {
        lines.push(`  Pen loss: +${u.penLossBonus}pt → ${u.ptsAfterPenLoss}pts → #${u.rankAfterPenLoss}`);
      }
      lines.push(`  Regular loss: +0pts → stays #${u.currentRank}`);
    } else {
      if (u.pointsEarnedThisMatch !== undefined) {
        lines.push(`Points earned this match: +${u.pointsEarnedThisMatch}pts`);
        lines.push(`Updated standing: #${u.currentRank}, ${u.currentPoints}pts`);
      }
    }

    if (u.effPick) {
      const ep = u.effPick;
      lines.push(
        `Efficiency pick: ${ep.playerName}`,
        `  Current stats: ${ep.currentGoals}G ${ep.currentAssists}A ${ep.currentMinutes}min → efficiency ${ep.currentEfficiency} (#${ep.effRank} in efficiency pot)`,
      );
      if (ep.gapToEffLeader !== null) {
        lines.push(`  Gap to efficiency leader (${ep.effLeaderName}): ${ep.gapToEffLeader} behind`);
      } else {
        lines.push(`  LEADS the efficiency pot`);
      }
      if (type === "pregame") {
        lines.push(
          "  Match scenarios (assuming standard 90-min appearance):",
          `    Scoreless: (${ep.scoreless90.newGoals}G ${ep.scoreless90.newAssists}A ${ep.scoreless90.newMinutes}min) → ${ep.scoreless90.newEfficiency} [${ep.scoreless90.dir} ${ep.scoreless90.change > 0 ? "+" : ""}${ep.scoreless90.change}]`,
          `    1 goal:    (${ep.oneGoal90.newGoals}G ${ep.oneGoal90.newAssists}A ${ep.oneGoal90.newMinutes}min) → ${ep.oneGoal90.newEfficiency} [${ep.oneGoal90.dir} ${ep.oneGoal90.change > 0 ? "+" : ""}${ep.oneGoal90.change}]`,
          `    1 assist:  (${ep.oneAssist90.newGoals}G ${ep.oneAssist90.newAssists}A ${ep.oneAssist90.newMinutes}min) → ${ep.oneAssist90.newEfficiency} [${ep.oneAssist90.dir} ${ep.oneAssist90.change > 0 ? "+" : ""}${ep.oneAssist90.change}]`,
          `    1G + 1A:   (${ep.oneGoalOneAssist90.newGoals}G ${ep.oneGoalOneAssist90.newAssists}A ${ep.oneGoalOneAssist90.newMinutes}min) → ${ep.oneGoalOneAssist90.newEfficiency} [${ep.oneGoalOneAssist90.dir} ${ep.oneGoalOneAssist90.change > 0 ? "+" : ""}${ep.oneGoalOneAssist90.change}]`,
          `    2 goals:   (${ep.twoGoals90.newGoals}G ${ep.twoGoals90.newAssists}A ${ep.twoGoals90.newMinutes}min) → ${ep.twoGoals90.newEfficiency} [${ep.twoGoals90.dir} ${ep.twoGoals90.change > 0 ? "+" : ""}${ep.twoGoals90.change}]`,
          `  !! RULE: Only use the word "boost"/"improve"/"rose" if direction shows UP. Scoreless = efficiency DROPS.`,
        );
      } else {
        lines.push(`  [Post-match stats above reflect current totals after admin update.]`);
      }
    }

    if (u.discPick) {
      const d = u.discPick;
      lines.push(`Discipline: ${u.displayName}'s teams have ${d.currentCardPts}pts (#${d.discRank} worst — higher is worse)`);
      if (d.isWorstDiscipline) {
        lines.push(`  LEADS the discipline pot (most card chaos)`);
      } else if (d.gapToWorst !== null) {
        lines.push(`  ${d.gapToWorst}pts behind worst-disciplined user (${d.worstName})`);
      }
      if (type === "pregame") {
        lines.push(
          `  Yellow card in this match: +1pt → ${d.afterYellow.newPts}pts → #${d.afterYellow.newRank} worst`,
          `  Straight red: +4pts → ${d.afterStraightRed.newPts}pts → #${d.afterStraightRed.newRank} worst`,
        );
      }
    }

    lines.push("");
  }

  lines.push("FULL STANDINGS:");
  for (const s of ctx.allStandings) {
    const nick = s.nickname ? ` ("${s.nickname}")` : "";
    lines.push(`  #${s.rank}. ${s.displayName}${nick} — ${s.totalPoints}pts`);
  }
  lines.push("");

  return lines.join("\n");
}

// ─── Prompt builders ───────────────────────────────────────────────────────────

export function buildPreGamePrompt(ctx: MatchContext): string {
  return [
    buildContextText(ctx, "pregame"),
    "=== YOUR TASK ===",
    "Write a pre-game summary (2–4 punchy sentences, NO headers or bullet points).",
    "Highlight: who's at stake, what a win/loss means for their standing, efficiency subplot if relevant.",
    "STRICT RULES:",
    "- Every number you write must appear verbatim above.",
    "- NEVER compute, infer, or estimate a number.",
    "- NEVER say efficiency improved/boosted unless direction shows UP above.",
    "- Use nicknames (shown in quotes) as recurring bits.",
    "- ONE country connection fact if 100% certain — otherwise OMIT it.",
  ].join("\n");
}

export function buildPostGamePrompt(ctx: MatchContext): string {
  return [
    buildContextText(ctx, "postgame"),
    "=== YOUR TASK ===",
    "Write a post-game recap (2–4 punchy sentences, NO headers or bullet points).",
    "Highlight: the result, pool-standings impact, any card carnage, efficiency subplot.",
    "STRICT RULES:",
    "- Every number you write must appear verbatim above.",
    "- NEVER compute, infer, or estimate a number.",
    "- Use nicknames (shown in quotes) as recurring bits.",
    "- ONE country connection fact if 100% certain — otherwise OMIT it.",
  ].join("\n");
}

// ─── System prompt (varies by sass level) ─────────────────────────────────────

const SASS_DESCRIPTIONS: Record<SassLevel, string> = {
  mild:
    "Warm, friendly group-chat energy. Light teasing only — encouraging teammate vibes with a gentle smile.",
  medium:
    "Punchy, witty group-chat trash-talk among actual friends. Roast the gaps and outcomes, use nicknames as running bits. Friendly-mean: tease numbers and results, not people personally.",
  spicy:
    "Full savage mode — demolish the gaps, mock the outcomes, call out the brutal numbers. Every point gap is a disaster. Friendly-mean: you're roasting numbers, teams, and choices — never attacking anyone personally.",
  unhinged:
    "Complete chaos and maximum drama. Treat every result like the greatest or most catastrophic thing ever. Hyperbolic, devastating, extremely loud. Use ONLY the provided facts but react to them like it's the end of civilisation. Friendly-mean (never actually mean), zero personal attacks.",
};

export function buildSystemPrompt(sassLevel: SassLevel): string {
  return [
    "You are the sassy, opinionated voice of a private WC2026 fantasy football pool of friends.",
    `Tone: ${SASS_DESCRIPTIONS[sassLevel]}`,
    "",
    "ABSOLUTE RULES — violating these makes the output wrong and useless:",
    "1. EVERY number, rank, gap, efficiency value, or point total you write must appear verbatim in the context.",
    "2. NEVER compute, infer, estimate, or derive any number yourself.",
    "3. NEVER say efficiency improved / got a boost / rose unless the context explicitly shows direction: UP for that scenario. Scoreless playing time LOWERS efficiency — the context says DOWN.",
    "4. NEVER invent goals, cards, players, scorers, or events not in the context.",
    "5. NEVER predict specific results or individual outcomes.",
    "6. Use nicknames (shown in quotes in the context) — make them recurring bits.",
    "7. Country/history fact: ONE real widely-known connection between the two countries ONLY if 100% certain. If any doubt, OMIT — a missing fact beats an invented one.",
    "8. Output: 2–4 punchy sentences. No headers, no bullet points. Pure prose.",
    `9. Sass level is ${sassLevel.toUpperCase()}.`,
  ].join("\n");
}

// ─── Legacy exports (keep actions.ts compiling during transition) ─────────────

/** @deprecated Use buildSystemPrompt(sassLevel) instead */
export const SYSTEM_PROMPT = buildSystemPrompt("medium");
