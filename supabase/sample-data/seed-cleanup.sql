-- ============================================================
-- Demo seed cleanup — removes all data inserted by seed-demo.sql
-- Run this before going live to wipe test data.
-- Does NOT delete profiles, teams, fixtures, or settings.
-- ============================================================

-- Remove demo predictions
delete from predictions;

-- Remove demo efficiency picks
delete from efficiency_picks;

-- Remove demo draft preferences
delete from draft_preferences;

-- Reset all match results back to scheduled
update matches set
  home_goals      = null,
  away_goals      = null,
  status          = 'scheduled',
  went_to_et      = false,
  went_to_shootout = false,
  shootout_winner = null;

-- Clear all match stats (goals + cards)
delete from match_stats;

-- Clear penalty events
delete from penalty_events;

-- Confirm
select 'predictions' as table_name, count(*) from predictions
union all select 'efficiency_picks', count(*) from efficiency_picks
union all select 'draft_preferences', count(*) from draft_preferences
union all select 'match_stats', count(*) from match_stats
union all select 'finished matches', count(*) from matches where status = 'finished';
-- All counts should be 0
