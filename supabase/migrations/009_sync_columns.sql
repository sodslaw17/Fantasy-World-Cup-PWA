-- Adds auto/manual override columns and last_synced_at to synced tables.
-- Effective value rule: effective_col = COALESCE(manual_col, auto_col)
-- The original column (e.g. "yellows") stores the effective value and is what
-- the scoring engine reads — no scoring changes required.

-- ── matches: score & status from API ─────────────────────────────────────────

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_goals_auto         int,
  ADD COLUMN IF NOT EXISTS away_goals_auto         int,
  ADD COLUMN IF NOT EXISTS home_goals_manual       int,
  ADD COLUMN IF NOT EXISTS away_goals_manual       int,
  ADD COLUMN IF NOT EXISTS status_auto             text CHECK (status_auto   IN ('scheduled','live','finished')),
  ADD COLUMN IF NOT EXISTS status_manual           text CHECK (status_manual IN ('scheduled','live','finished')),
  ADD COLUMN IF NOT EXISTS went_to_shootout_auto   boolean,
  ADD COLUMN IF NOT EXISTS shootout_winner_auto    text CHECK (shootout_winner_auto IN ('home','away')),
  ADD COLUMN IF NOT EXISTS last_synced_at          timestamptz;

-- Backfill: protect manually-entered results from being overwritten on first sync.
UPDATE matches
SET home_goals_manual = home_goals,
    away_goals_manual = away_goals,
    status_manual     = 'finished'
WHERE status = 'finished' AND home_goals IS NOT NULL;

-- ── match_stats: card counts from API events ──────────────────────────────────

ALTER TABLE match_stats
  ADD COLUMN IF NOT EXISTS yellows_auto          int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yellows_manual        int,
  ADD COLUMN IF NOT EXISTS second_yellows_auto   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS second_yellows_manual int,
  ADD COLUMN IF NOT EXISTS straight_reds_auto    int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS straight_reds_manual  int,
  ADD COLUMN IF NOT EXISTS last_synced_at        timestamptz;

-- Backfill: protect manually-entered card counts.
UPDATE match_stats
SET yellows_manual        = yellows,
    second_yellows_manual = second_yellows,
    straight_reds_manual  = straight_reds
WHERE yellows > 0 OR second_yellows > 0 OR straight_reds > 0;

-- ── efficiency_picks: player stats from API ───────────────────────────────────

ALTER TABLE efficiency_picks
  ADD COLUMN IF NOT EXISTS goals_auto     int,
  ADD COLUMN IF NOT EXISTS goals_manual   int,
  ADD COLUMN IF NOT EXISTS assists_auto   int,
  ADD COLUMN IF NOT EXISTS assists_manual int,
  ADD COLUMN IF NOT EXISTS minutes_auto   int,
  ADD COLUMN IF NOT EXISTS minutes_manual int,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Backfill: protect manually-entered efficiency stats.
UPDATE efficiency_picks
SET goals_manual   = goals,
    assists_manual = assists,
    minutes_manual = minutes
WHERE goals > 0 OR assists > 0 OR minutes > 0;
