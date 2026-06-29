-- Stable pool nicknames (user-level and user+team-level).
-- team_code = '' means a user-level nickname; 'BRA' etc. means user+team nickname.
create table pool_nicknames (
  profile_id uuid not null references profiles(id) on delete cascade,
  team_code   text not null default '',
  nickname    text not null,
  status      text not null default 'generated'
                check (status in ('generated','edited')),
  generated_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (profile_id, team_code)
);

alter table pool_nicknames enable row level security;
create policy "read nicknames" on pool_nicknames for select to authenticated using (true);

-- Commentary config (singleton row — one sass-level setting for the whole pool).
create table commentary_config (
  singleton   boolean primary key default true check (singleton = true),
  sass_level  text not null default 'medium'
                check (sass_level in ('mild','medium','spicy','unhinged')),
  updated_at  timestamptz not null default now()
);

insert into commentary_config (singleton) values (true) on conflict do nothing;

alter table commentary_config enable row level security;
create policy "read commentary_config" on commentary_config for select to authenticated using (true);
