// Shared slot-label helper used by BracketScreen and the admin bracket-wiring UI.
// Given a bracket slot (code + optional feeder match id + outcome), returns a
// human-readable label: "USA" if decided, "USA/MEX" if two candidates, never a UUID.

export interface LabelNode {
  winner: string | null;
  loser: string | null;
  homeCode: string | null;
  awayCode: string | null;
  homeFeedId: string | null;
  awayFeedId: string | null;
  homeFeedOutcome: 'winner' | 'loser';
  awayFeedOutcome: 'winner' | 'loser';
}

// Returns the team code(s) that fill a slot.
// outcome='winner': winner of feeder advances (default for all rounds except Bronze)
// outcome='loser':  loser  of feeder advances (Bronze Final)
export function slotLabel(
  code: string | null,
  feedId: string | null,
  byId: Record<string, LabelNode>,
  depth = 0,
  outcome: 'winner' | 'loser' = 'winner'
): string {
  if (code) return code;
  if (!feedId) return "?";
  const node = byId[feedId];
  if (!node) return "?";
  const resolved = outcome === 'winner' ? node.winner : node.loser;
  if (resolved) return resolved;
  if (depth >= 4) return "?";
  // Feeder undecided — show both participants of the feeder match as candidates
  const h = slotLabel(node.homeCode, node.homeFeedId, byId, depth + 1, node.homeFeedOutcome);
  const a = slotLabel(node.awayCode, node.awayFeedId, byId, depth + 1, node.awayFeedOutcome);
  const parts = [h, a].filter((s) => s !== "?");
  return parts.join("/") || "?";
}

// Human-readable prefix shown before the candidate label in undecided slots.
export function slotPrefix(outcome: 'winner' | 'loser'): string {
  return outcome === 'loser' ? 'Loser of' : 'Winner of';
}
