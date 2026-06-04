/**
 * Returns the overall pick numbers for a given snake-draft position.
 * @param position  1-based position in the snake (1 = first pick)
 * @param players   total number of drafters (default 10)
 * @param rounds    total rounds / teams per drafter (default 3)
 */
export function snakePickNumbers(
  position: number,
  players = 10,
  rounds = 3
): number[] {
  const picks: number[] = [];
  for (let round = 0; round < rounds; round++) {
    if (round % 2 === 1) {
      // Reverse round — highest position picks first
      picks.push(round * players + (players - position + 1));
    } else {
      // Forward round — position 1 picks first
      picks.push(round * players + position);
    }
  }
  return picks;
}

/** Pre-computed pick numbers for all 10 positions (10 players, 3 rounds). */
export const SNAKE_PICKS: Record<number, number[]> = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [i + 1, snakePickNumbers(i + 1)])
);
