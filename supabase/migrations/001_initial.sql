-- ============================================================
-- Migration 001: Phase 0 — user gate
-- ============================================================

-- Profiles table: admin pre-creates a row per user before they can log in.
-- auth_id is null until the user completes their first magic-link login.
create table if not exists profiles (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null unique,
  display_name text      not null,
  auth_id    uuid        unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: authenticated users can read only their own profile.
-- All writes (inserts, updates) happen via the service role (admin UI / auth callback).
alter table profiles enable row level security;

create policy "users_select_own" on profiles
  for select
  to authenticated
  using (auth.uid() = auth_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- Settings table: admin-configurable global values.
-- Single-row pattern — enforce with a CHECK constraint.
-- ============================================================
create table if not exists settings (
  singleton            boolean      primary key default true check (singleton),
  prediction_deadline_utc timestamptz not null
    default '2026-06-11 19:00:00+00',  -- Jun 11 2pm Central
  draft_standby_text   text         not null
    default 'The group stage is over! Standby for a text confirming your draft picks.',
  current_phase_override text        -- null = auto-detect; values: buy_in | groups | draft_standby | knockout
);

-- RLS: anyone authenticated can read settings; only service role can write.
alter table settings enable row level security;

create policy "settings_select" on settings
  for select
  to authenticated
  using (true);

-- Insert the default settings row
insert into settings default values
  on conflict (singleton) do nothing;
