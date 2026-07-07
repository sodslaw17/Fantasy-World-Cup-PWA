-- ============================================================
-- Migration 016: Per-game efficiency stats
-- ============================================================
-- Efficiency picks previously stored one lump total (goals/assists/minutes)
-- per user for the whole tournament, entered by hand. This adds a per-game
-- breakdown table so the admin can enter stats one match at a time.
--
-- efficiency_picks.goals/assists/minutes are kept, unchanged in meaning —
-- they still hold the effective totals the scoring engine reads — but a
-- trigger now keeps them equal to the SUM of the pick's
-- efficiency_match_stats rows. No scoring/leaderboard code needs to change.

create table efficiency_match_stats (
  id                  uuid primary key default gen_random_uuid(),
  efficiency_pick_id  uuid not null references efficiency_picks(id) on delete cascade,
  -- null match_id = the migrated "prior total" row (see backfill below);
  -- every other row must reference a real match.
  match_id            uuid references matches(id) on delete cascade,
  is_prior_total      boolean not null default false,
  goals               int not null default 0 check (goals   >= 0),
  assists             int not null default 0 check (assists >= 0),
  minutes             int not null default 0 check (minutes >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint efficiency_match_stats_pick_match_unique unique (efficiency_pick_id, match_id),
  constraint efficiency_match_stats_prior_total_shape check (
    (is_prior_total and match_id is null) or (not is_prior_total and match_id is not null)
  )
);

-- Only one "prior total" bucket row per pick.
create unique index efficiency_match_stats_one_prior_total
  on efficiency_match_stats(efficiency_pick_id) where is_prior_total;

create index efficiency_match_stats_pick_idx on efficiency_match_stats(efficiency_pick_id);

alter table efficiency_match_stats enable row level security;
create policy "efficiency_match_stats_select" on efficiency_match_stats
  for select to authenticated using (true);

create trigger efficiency_match_stats_updated_at
  before update on efficiency_match_stats
  for each row execute function set_updated_at();

-- ── Keep efficiency_picks totals equal to the sum of its game rows ───────────

create or replace function recompute_efficiency_pick_totals() returns trigger
language plpgsql as $$
declare
  affected_pick_id uuid := coalesce(new.efficiency_pick_id, old.efficiency_pick_id);
begin
  update efficiency_picks
  set goals   = coalesce((select sum(goals)   from efficiency_match_stats where efficiency_pick_id = affected_pick_id), 0),
      assists = coalesce((select sum(assists) from efficiency_match_stats where efficiency_pick_id = affected_pick_id), 0),
      minutes = coalesce((select sum(minutes) from efficiency_match_stats where efficiency_pick_id = affected_pick_id), 0)
  where id = affected_pick_id;
  return null;
end;
$$;

create trigger efficiency_match_stats_recompute
  after insert or update or delete on efficiency_match_stats
  for each row execute function recompute_efficiency_pick_totals();

-- ── Backfill: preserve any lump totals already entered ───────────────────────
-- Existing goals/assists/minutes (already COALESCE(manual, auto) from
-- migration 009) become a single "prior total" row per pick, so nothing is
-- lost. The recompute trigger then re-derives efficiency_picks' totals from
-- this row, which reproduces the same numbers.

insert into efficiency_match_stats (efficiency_pick_id, match_id, is_prior_total, goals, assists, minutes)
select id, null, true, goals, assists, minutes
from efficiency_picks
where goals > 0 or assists > 0 or minutes > 0;
