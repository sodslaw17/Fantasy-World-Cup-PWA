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
