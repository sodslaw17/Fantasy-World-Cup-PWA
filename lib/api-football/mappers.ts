import type { ApiFixture, ApiFixtureEvent } from "./types";
import type { MatchStatus } from "@/lib/db";

export function mapFixtureStatus(short: string): MatchStatus {
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["NS", "TBD", "PST", "CANC", "ABD", "WO"].includes(short)) return "scheduled";
  return "live"; // 1H, HT, 2H, ET, BT, P, INT, LIVE
}

export function mapShootoutWinner(fixture: ApiFixture): "home" | "away" | null {
  if (fixture.fixture.status.short !== "PEN") return null;
  // Penalty shootout winner isn't directly exposed in the basic fixture payload;
  // rely on admin confirmation rather than inferring.
  return null;
}

export interface CardCounts {
  yellows: number;
  secondYellows: number;
  straightReds: number;
}

/** Tally yellow / second-yellow / straight-red cards for one team from match events. */
export function mapCardsFromEvents(
  events: ApiFixtureEvent[],
  teamApiId: number
): CardCounts {
  let yellows = 0, secondYellows = 0, straightReds = 0;
  for (const evt of events) {
    if (evt.type !== "Card" || evt.team.id !== teamApiId) continue;
    if (evt.detail === "Yellow Card") yellows++;
    else if (evt.detail === "Yellow Red Card") secondYellows++;
    else if (evt.detail === "Red Card") straightReds++;
  }
  return { yellows, secondYellows, straightReds };
}
