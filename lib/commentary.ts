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
  discRank: number;             // 1 = most carded = discipline pot LEADER = currently winning the $30
  isWorstDiscipline: boolean;   // true = currently leading the discipline pot (winning $30)
  gapToWorst: number | null;    // null = IS the pot leader; otherwise pts behind the leader
  worstName: string | null;     // current discipline pot leader's name
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
      lines.push(`Discipline side pot ($30 to MOST carded): ${u.displayName}'s teams have ${d.currentCardPts}pts → currently #${d.discRank} (rank #1 = most carded = pot LEADER = WINNING the $30)`);
      if (d.isWorstDiscipline) {
        lines.push(`  ★ LEADS the discipline pot — most card pts = currently WINNING the $30`);
      } else if (d.gapToWorst !== null) {
        lines.push(`  ${d.gapToWorst}pts behind discipline pot leader ${d.worstName} (leader = most carded = winning $30)`);
      }
      if (type === "pregame") {
        lines.push(
          `  Yellow card HELPS them: +1pt → ${d.afterYellow.newPts}pts → #${d.afterYellow.newRank} in discipline pot`,
          `  Straight red HELPS more: +4pts → ${d.afterStraightRed.newPts}pts → #${d.afterStraightRed.newRank} in discipline pot`,
          `  !! RULE: More cards = WINNING this pot. Being clean = LOSING. A yellow/red is GOOD for the discipline pot.`,
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
    "Write a pre-game summary (4–6 sentences, NO headers, NO bullet points, pure prose).",
    "Pick the 1–2 most dramatic facts from the context above — use those as seasoning, not a list.",
    "One DEADPAN BUTTON: land one completely flat, understated sentence to deliver the joke.",
    "1–2 BURN LINES: go after their pool standing, their team pick, their odds. Not their life.",
    "RANDOM JAB: if another user appears in the standings, take one unprovoked shot at them.",
    "STRICT RULES:",
    "- Every number must appear verbatim above. NEVER calculate or infer.",
    "- NEVER say efficiency improved/boosted/rose unless direction shows UP in the context.",
    "- Use nicknames (shown in quotes) as recurring bits.",
  ].join("\n");
}

export function buildPostGamePrompt(ctx: MatchContext): string {
  return [
    buildContextText(ctx, "postgame"),
    "=== YOUR TASK ===",
    "Write a post-game recap (4–6 sentences, NO headers, NO bullet points, pure prose).",
    "Pick the 1–2 most dramatic facts — result impact, card carnage, efficiency chaos. Not all of them.",
    "One DEADPAN BUTTON: one flat, understated line to land the joke.",
    "1–2 BURN LINES: roast their standing, their team, their pick. Never personal.",
    "RANDOM JAB: if another user appears in standings, take one unprovoked shot.",
    "STRICT RULES:",
    "- Every number must appear verbatim above. NEVER calculate or infer.",
    "- Use nicknames (shown in quotes) as recurring bits.",
  ].join("\n");
}

// ─── System prompt (varies by sass level) ─────────────────────────────────────

const VOICE_CORE = `You are the announcer for a private WC2026 fantasy pool — equal parts Roman coliseum MC and unhinged group-chat trash-talker. Mean, theatrical, and genuinely funny.

CHARACTER:
- Grandiose build-up, then deflate with attitude. Build the drama, then undercut it.
- Use THEY/THEM for every player at all times. Use the person's name when two people share the same summary and you need to distinguish them.
- The pool is the arena. Their rank, their points, their team picks, their results — that's the ring. Nothing else.

FORMAT (STRICT — mobile card):
- 4 to 6 sentences. Never fewer, never more.
- No headers. No bullet points. Pure prose.
- Facts are SEASONING: pick the 1–2 most dramatic numbers from the context and use those. Do NOT enumerate every scenario path.
- One DEADPAN BUTTON per summary: end one sentence with a completely flat, understated observation to land the joke.
- 1–2 BURN LINES mandatory: roast their pool standing, their team pick, their odds. Never their real life.
- RANDOM JAB: if another user from the standings appears, take one unprovoked shot at them too.

ABSOLUTE RULES (violations = broken, unusable output):
1. Every rank, point total, gap, and efficiency value must appear verbatim in the context. NEVER invent or calculate any number.
2. NEVER say efficiency improved/boosted/rose unless the context shows direction: UP. Scoreless minutes = DOWN efficiency.
3. NEVER invent goals, cards, players, scorers, or match events.
4. NEVER predict specific outcomes — only reference what the computed scenarios say.
5. Roast ONLY pool-relevant things: rank, points, team picks, results, in-game choices. NEVER their name, appearance, identity, or anything actually personal. Savage about fantasy performance, never about them.
6. Use nicknames (shown in quotes in the context) as recurring character bits.`;

const SASS_INTENSITY: Record<SassLevel, string> = {
  mild:     "Dial the theatrics to 40%: friendly ribbing, warmer tone. Still uses this voice, just gentler — like a coliseum announcer having a good day.",
  medium:   "Dial the theatrics to 70%: mock the gaps, land the burn lines, keep it fun-mean. The crowd is entertained.",
  spicy:    "Full voice at 100%: maximum theatrics, devastating burns, full coliseum energy. The crowd wants blood.",
  unhinged: "110%: hyperbolic to the point of absurdity. Every result is either the greatest or most catastrophic thing ever. Still all from provided facts — just reacted to like it's the end of civilisation.",
};

export function buildSystemPrompt(sassLevel: SassLevel): string {
  return [
    VOICE_CORE,
    "",
    `Intensity: ${sassLevel.toUpperCase()} — ${SASS_INTENSITY[sassLevel]}`,
  ].join("\n");
}

// ─── Legacy exports (keep actions.ts compiling during transition) ─────────────

/** @deprecated Use buildSystemPrompt(sassLevel) instead */
export const SYSTEM_PROMPT = buildSystemPrompt("medium");
