-- Bracket match-progression wiring.
-- Each knockout match records which earlier matches feed its two slots.
-- When home_team_code is null, the home slot resolves to the winner of home_feed_match_id.
-- BracketScreen already reads { win: matchId } slots — this is the data backing for it.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_feed_match_id uuid REFERENCES matches(id),
  ADD COLUMN IF NOT EXISTS away_feed_match_id uuid REFERENCES matches(id);

-- Index for fast look-ups when walking the bracket graph.
CREATE INDEX IF NOT EXISTS idx_matches_home_feed ON matches (home_feed_match_id) WHERE home_feed_match_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_away_feed ON matches (away_feed_match_id) WHERE away_feed_match_id IS NOT NULL;
