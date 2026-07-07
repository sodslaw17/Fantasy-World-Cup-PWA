-- Distinguishes which sync pipeline produced a sync_log row now that there are
-- two independent auto sources (API-Football and ESPN). Existing rows all came
-- from the API-Football engine, so they backfill via the column default.

ALTER TABLE sync_log
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'api-football'
    CHECK (source IN ('api-football', 'espn'));
