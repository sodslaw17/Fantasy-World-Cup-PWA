export type Phase = "predictions" | "groups" | "draft_standby" | "knockout";

export interface PhaseSettings {
  prediction_deadline_utc: string;
  group_end_utc: string | null;
  knockout_start_utc: string | null;
  current_phase_override: string | null;
}

/**
 * Derives the current tournament phase from settings timestamps.
 * Admin can override via current_phase_override.
 *
 * Timeline:
 *   now < deadline                 → predictions (buy-in / entry)
 *   deadline ≤ now < group_end     → groups (leaderboard, today's games)
 *   group_end ≤ now < knockout     → draft_standby (await SMS)
 *   now ≥ knockout_start           → knockout
 */
export function getCurrentPhase(
  settings: PhaseSettings,
  now: Date = new Date()
): Phase {
  if (settings.current_phase_override) {
    return settings.current_phase_override as Phase;
  }

  const deadline = new Date(settings.prediction_deadline_utc);
  const groupEnd = settings.group_end_utc
    ? new Date(settings.group_end_utc)
    : null;
  const knockoutStart = settings.knockout_start_utc
    ? new Date(settings.knockout_start_utc)
    : null;

  if (now < deadline) return "predictions";
  if (knockoutStart && now >= knockoutStart) return "knockout";
  if (groupEnd && now >= groupEnd) return "draft_standby";
  return "groups";
}
