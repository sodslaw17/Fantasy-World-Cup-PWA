-- Maps external API entity IDs to our internal records.
-- resource_type='team'    → internal_id references teams.id
-- resource_type='player'  → internal_id references efficiency_picks.id
-- resource_type='fixture' → internal_id references matches.id (auto-populated by sync engine)

CREATE TABLE IF NOT EXISTS api_id_mappings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text        NOT NULL CHECK (resource_type IN ('team', 'player', 'fixture')),
  internal_id   uuid        NOT NULL,
  provider      text        NOT NULL DEFAULT 'api-football',
  api_id        text        NOT NULL,
  verified      boolean     NOT NULL DEFAULT false,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_type, internal_id, provider),
  UNIQUE (resource_type, api_id, provider)
);

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER api_id_mappings_updated_at
  BEFORE UPDATE ON api_id_mappings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
