-- Migration 003: phase control + draft lock

alter table settings
  add column if not exists group_end_utc       timestamptz,
  add column if not exists knockout_start_utc  timestamptz,
  add column if not exists draft_locked        boolean not null default false;

-- Default phase timestamps for WC 2026
-- group_end:      last group match finishes ~midnight UTC Jun 28
-- knockout_start: first R32 kickoff Jun 28 22:00 UTC
update settings set
  group_end_utc      = '2026-06-28T01:00:00Z',
  knockout_start_utc = '2026-06-28T22:00:00Z'
where singleton = true;
