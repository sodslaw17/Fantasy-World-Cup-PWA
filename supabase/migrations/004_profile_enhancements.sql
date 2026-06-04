-- Migration 004: profile photos, footballer photos, draft preferences

alter table profiles
  add column if not exists avatar_url text;

alter table efficiency_picks
  add column if not exists player_photo_url text;

-- Users' draft planning: preferred snake position + ranked team wishlist
create table if not exists draft_preferences (
  profile_id        uuid primary key references profiles(id) on delete cascade,
  preferred_position int  check (preferred_position between 1 and 10),
  team_wishlist      text[],  -- ordered array of fifa_codes (1st choice first)
  notes              text,
  updated_at         timestamptz not null default now()
);

alter table draft_preferences enable row level security;

-- Users can only read and write their own preferences
create policy "draft_prefs_own" on draft_preferences
  for all
  using (
    profile_id = (
      select id from profiles where auth_id = auth.uid() limit 1
    )
  )
  with check (
    profile_id = (
      select id from profiles where auth_id = auth.uid() limit 1
    )
  );

create trigger draft_prefs_updated_at
  before update on draft_preferences
  for each row execute function set_updated_at();
