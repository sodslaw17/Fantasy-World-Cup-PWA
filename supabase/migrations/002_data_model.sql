-- ============================================================
-- Migration 002: Core data model
-- ============================================================
-- Note: set_updated_at() trigger function was created in 001.

-- ── Teams ─────────────────────────────────────────────────────
create table teams (
  id              uuid  primary key default gen_random_uuid(),
  fifa_code       text  not null,
  name            text  not null,
  group_letter    text  check (group_letter ~ '^[A-L]$'),
  flag_url        text,
  custom_icon_url text,
  created_at      timestamptz not null default now(),
  constraint teams_fifa_code_unique unique (fifa_code)
);

alter table teams enable row level security;
create policy "teams_select" on teams for select to authenticated using (true);

create index teams_group_idx on teams(group_letter);


-- ── Matches ───────────────────────────────────────────────────
create table matches (
  id              uuid  primary key default gen_random_uuid(),
  stage           text  not null
    check (stage in ('group','r32','r16','qf','sf','bronze','final')),
  group_letter    text  check (
    (stage = 'group' and group_letter ~ '^[A-L]$') or
    (stage <> 'group' and group_letter is null)
  ),
  home_team_code  text  references teams(fifa_code) on update cascade,
  away_team_code  text  references teams(fifa_code) on update cascade,
  kickoff_utc     timestamptz not null,
  venue           text,
  status          text  not null default 'scheduled'
    check (status in ('scheduled','live','finished')),
  home_goals      int   check (home_goals >= 0),
  away_goals      int   check (away_goals >= 0),
  went_to_et      boolean not null default false,
  went_to_shootout boolean not null default false,
  shootout_winner text  check (shootout_winner in ('home','away')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Each ordered pair plays at most once (enables CSV re-import / upsert)
  constraint unique_fixture unique (home_team_code, away_team_code),

  -- Shootout ⟹ score was level after 90+ET
  constraint shootout_implies_draw check (
    not went_to_shootout or home_goals = away_goals
  ),
  -- shootout_winner set iff went_to_shootout
  constraint shootout_winner_consistency check (
    (went_to_shootout  and shootout_winner is not null) or
    (not went_to_shootout and shootout_winner is null)
  )
);

alter table matches enable row level security;
create policy "matches_select" on matches for select to authenticated using (true);

create index matches_stage_group_idx on matches(stage, group_letter);
create index matches_kickoff_idx     on matches(kickoff_utc);

create trigger matches_updated_at
  before update on matches
  for each row execute function set_updated_at();


-- ── Predictions ───────────────────────────────────────────────
-- user_id = auth.uid(); constrained by RLS (no FK to avoid coupling to auth.users directly)
create table predictions (
  user_id          uuid not null,
  match_id         uuid not null references matches(id) on delete cascade,
  home_goals_pred  int  not null check (home_goals_pred >= 0),
  away_goals_pred  int  not null check (away_goals_pred >= 0),
  updated_at       timestamptz not null default now(),
  primary key (user_id, match_id)
);

alter table predictions enable row level security;

-- Everyone can see all predictions (needed for "others' predictions" view)
create policy "predictions_select" on predictions
  for select to authenticated using (true);

-- Users may only insert their own prediction before the deadline
create policy "predictions_insert" on predictions
  for insert to authenticated
  with check (
    user_id = auth.uid() and
    now() < (select prediction_deadline_utc from settings limit 1)
  );

-- Users may only update their own prediction before the deadline
create policy "predictions_update" on predictions
  for update to authenticated
  using  (user_id = auth.uid())
  with check (
    user_id = auth.uid() and
    now() < (select prediction_deadline_utc from settings limit 1)
  );

create index predictions_user_idx  on predictions(user_id);
create index predictions_match_idx on predictions(match_id);

create trigger predictions_updated_at
  before update on predictions
  for each row execute function set_updated_at();


-- ── Drafts ────────────────────────────────────────────────────
-- Admin-entered after the group stage. Each team may be drafted by exactly one user.
create table drafts (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  team_id     uuid not null references teams(id)    on delete cascade,
  pick_number int  not null,
  created_at  timestamptz not null default now(),
  unique (profile_id, team_id),
  unique (team_id)          -- one drafter per team
);

alter table drafts enable row level security;
create policy "drafts_select" on drafts for select to authenticated using (true);


-- ── Efficiency picks (1st Side Pot) ───────────────────────────
-- Each user pre-selects one footballer. Admin enters final stats.
create table efficiency_picks (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null unique references profiles(id) on delete cascade,
  player_name  text not null,
  team_code    text references teams(fifa_code) on update cascade,
  goals        int  not null default 0 check (goals   >= 0),
  assists      int  not null default 0 check (assists >= 0),
  minutes      int  not null default 0 check (minutes >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table efficiency_picks enable row level security;
create policy "efficiency_picks_select" on efficiency_picks
  for select to authenticated using (true);

create trigger efficiency_picks_updated_at
  before update on efficiency_picks
  for each row execute function set_updated_at();


-- ── Penalty events (per-penalty shootout scoring) ─────────────
-- Admin-entered per shootout penalty. Positive/negative scoring attributed to drafter.
create table penalty_events (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references matches(id) on delete cascade,
  team_code    text not null references teams(fifa_code) on update cascade,
  player_name  text,
  type         text not null
    check (type in ('off_target','panenka_fail','panenka_score')),
  created_at   timestamptz not null default now()
);

alter table penalty_events enable row level security;
create policy "penalty_events_select" on penalty_events
  for select to authenticated using (true);

create index penalty_events_match_idx on penalty_events(match_id);


-- ── Per-match team stats (goals + discipline) ─────────────────
-- Admin enters after each match. Drives knockout scoring and 2nd Side Pot.
-- goals = open-play + ET goals only (NOT shootout penalty goals).
create table match_stats (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid not null references matches(id) on delete cascade,
  team_code       text not null references teams(fifa_code) on update cascade,
  goals           int  not null default 0 check (goals           >= 0),
  yellows         int  not null default 0 check (yellows         >= 0),
  second_yellows  int  not null default 0 check (second_yellows  >= 0),
  straight_reds   int  not null default 0 check (straight_reds   >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (match_id, team_code)
);

alter table match_stats enable row level security;
create policy "match_stats_select" on match_stats
  for select to authenticated using (true);

create index match_stats_match_idx on match_stats(match_id);

create trigger match_stats_updated_at
  before update on match_stats
  for each row execute function set_updated_at();
