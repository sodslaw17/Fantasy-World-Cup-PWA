-- Records each sync run for monitoring and debugging.

CREATE TABLE IF NOT EXISTS sync_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at       timestamptz NOT NULL DEFAULT now(),
  finished_at      timestamptz,
  trigger          text        NOT NULL DEFAULT 'cron' CHECK (trigger IN ('cron','manual')),
  in_live_window   boolean     NOT NULL DEFAULT false,
  skipped          boolean     NOT NULL DEFAULT false,
  matches_checked  int         NOT NULL DEFAULT 0,
  matches_updated  int         NOT NULL DEFAULT 0,
  stats_updated    int         NOT NULL DEFAULT 0,
  picks_updated    int         NOT NULL DEFAULT 0,
  api_requests     int         NOT NULL DEFAULT 0,
  unmapped_teams   text[]      NOT NULL DEFAULT '{}',
  unmapped_players text[]      NOT NULL DEFAULT '{}',
  errors           text[]      NOT NULL DEFAULT '{}',
  status           text        NOT NULL DEFAULT 'running'
                               CHECK (status IN ('running','ok','error','skipped'))
);

-- Prune to last 200 rows after each insert to avoid unbounded growth.
CREATE OR REPLACE FUNCTION trim_sync_log() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM sync_log
  WHERE id NOT IN (SELECT id FROM sync_log ORDER BY started_at DESC LIMIT 200);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trim_sync_log_trigger
  AFTER INSERT ON sync_log
  FOR EACH ROW EXECUTE FUNCTION trim_sync_log();
