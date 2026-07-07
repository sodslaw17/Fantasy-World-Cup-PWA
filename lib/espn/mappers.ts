import type { EspnDetail, EspnStatus } from "./types";
import type { MatchStatus } from "@/lib/db";

export function mapEspnStatus(status: EspnStatus): MatchStatus {
  const state = status.type?.state;
  if (state === "pre") return "scheduled";
  if (state === "post") return "finished";
  return "live"; // "in" and any other in-progress-ish state (HT, ET, etc.)
}

export interface CardCounts {
  yellows: number;
  secondYellows: number;
  straightReds: number;
}

/**
 * Tally cards for one team from a competition's `details` events.
 *
 * ESPN's public feed only exposes two card event types — "Yellow Card" and
 * "Red Card" — with no distinct marker for a dismissal via second yellow
 * (confirmed against real 2022 World Cup data, e.g. Cameroon's Aboubakar vs
 * Brazil: a plain "Yellow Card" at 81' and a separate "Red Card" at 90+3',
 * with nothing in the payload flagging the red as a second-yellow). We infer
 * it structurally instead: if the same player already has a yellow earlier
 * in this match and is later shown a red, that's a second-yellow dismissal
 * (2 pts) — not a separate yellow plus a straight red (which would wrongly
 * score 1+4=5 instead of 2). A red with no prior yellow for that player is
 * scored as a straight red. This is a best-effort inference, not a
 * directly-reported field.
 */
export function mapCardsFromDetails(details: EspnDetail[], teamId: string): CardCounts {
  const teamDetails = details.filter((d) => d.team?.id === teamId);

  let yellows = 0;
  const yellowedPlayerIds = new Set<string>();
  for (const d of teamDetails) {
    if (!d.yellowCard) continue;
    yellows++;
    const playerId = d.athletesInvolved?.[0]?.id;
    if (playerId) yellowedPlayerIds.add(playerId);
  }

  let secondYellows = 0;
  let straightReds = 0;
  for (const d of teamDetails) {
    if (!d.redCard) continue;
    const playerId = d.athletesInvolved?.[0]?.id;
    if (playerId && yellowedPlayerIds.has(playerId)) {
      secondYellows++;
      yellows--; // subsumed into the dismissal, not counted twice
    } else {
      straightReds++;
    }
  }

  return { yellows: Math.max(0, yellows), secondYellows, straightReds };
}
