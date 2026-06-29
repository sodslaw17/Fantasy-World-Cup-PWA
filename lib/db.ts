// Database row types — keep in sync with migrations.

export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "bronze" | "final";
export type MatchStatus = "scheduled" | "live" | "finished";
export type PenaltyEventType = "off_target" | "panenka_fail" | "panenka_score";
export type ShootoutWinner = "home" | "away";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  auth_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  fifa_code: string;
  name: string;
  group_letter: string | null;
  flag_url: string | null;
  custom_icon_url: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  stage: Stage;
  group_letter: string | null;
  home_team_code: string | null;
  away_team_code: string | null;
  kickoff_utc: string;
  venue: string | null;
  status: MatchStatus;
  home_goals: number | null;
  away_goals: number | null;
  went_to_et: boolean;
  went_to_shootout: boolean;
  shootout_winner: ShootoutWinner | null;
  // Bracket progression wiring (migrations 011-012)
  home_feed_match_id: string | null;
  away_feed_match_id: string | null;
  // Which outcome of the feeder advances here: 'winner' (default) or 'loser' (Bronze Final)
  home_feed_outcome: 'winner' | 'loser';
  away_feed_outcome: 'winner' | 'loser';
  // Auto/manual sync columns (migration 009)
  home_goals_auto: number | null;
  away_goals_auto: number | null;
  home_goals_manual: number | null;
  away_goals_manual: number | null;
  status_auto: MatchStatus | null;
  status_manual: MatchStatus | null;
  went_to_shootout_auto: boolean | null;
  shootout_winner_auto: ShootoutWinner | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  user_id: string;
  match_id: string;
  home_goals_pred: number;
  away_goals_pred: number;
  updated_at: string;
}

export interface Draft {
  id: string;
  profile_id: string;
  team_id: string;
  pick_number: number;
  created_at: string;
}

export interface EfficiencyPick {
  id: string;
  profile_id: string;
  player_name: string;
  team_code: string | null;
  goals: number;
  assists: number;
  minutes: number;
  // Auto/manual sync columns (migration 009)
  goals_auto: number | null;
  assists_auto: number | null;
  minutes_auto: number | null;
  goals_manual: number | null;
  assists_manual: number | null;
  minutes_manual: number | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PenaltyEvent {
  id: string;
  match_id: string;
  team_code: string;
  player_name: string | null;
  type: PenaltyEventType;
  created_at: string;
}

export interface MatchStat {
  id: string;
  match_id: string;
  team_code: string;
  goals: number;
  yellows: number;
  second_yellows: number;
  straight_reds: number;
  // Auto/manual sync columns (migration 009)
  yellows_auto: number;
  second_yellows_auto: number;
  straight_reds_auto: number;
  yellows_manual: number | null;
  second_yellows_manual: number | null;
  straight_reds_manual: number | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiIdMapping {
  id: string;
  resource_type: "team" | "player" | "fixture";
  internal_id: string;
  provider: string;
  api_id: string;
  verified: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  trigger: "cron" | "manual";
  in_live_window: boolean;
  skipped: boolean;
  matches_checked: number;
  matches_updated: number;
  stats_updated: number;
  picks_updated: number;
  api_requests: number;
  unmapped_teams: string[];
  unmapped_players: string[];
  errors: string[];
  status: "running" | "ok" | "error" | "skipped";
}

export type CommentaryStatus = "none" | "generated" | "edited";

export interface MatchCommentary {
  match_id: string;
  pregame_text: string | null;
  pregame_status: CommentaryStatus;
  pregame_generated_at: string | null;
  postgame_text: string | null;
  postgame_status: CommentaryStatus;
  postgame_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  singleton: true;
  prediction_deadline_utc: string;
  draft_standby_text: string;
  current_phase_override: string | null;
  group_end_utc: string | null;
  knockout_start_utc: string | null;
  draft_locked: boolean;
}
