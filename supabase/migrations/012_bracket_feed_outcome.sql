-- Extend bracket wiring so each slot can advance the WINNER or LOSER of its feeder match.
-- Default 'winner' keeps all existing links correct with no data change.
-- The Bronze Final uses 'loser' for both slots (SF1 loser vs SF2 loser).

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_feed_outcome TEXT NOT NULL DEFAULT 'winner'
    CHECK (home_feed_outcome IN ('winner', 'loser')),
  ADD COLUMN IF NOT EXISTS away_feed_outcome TEXT NOT NULL DEFAULT 'winner'
    CHECK (away_feed_outcome IN ('winner', 'loser'));
