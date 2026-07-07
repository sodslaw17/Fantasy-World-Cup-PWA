/** Display an efficiency rate (goals+assists per minute) as a per-90 figure, rounded to 2 dp. */
export function formatPer90(rate: number): string {
  return (rate * 90).toFixed(2);
}
