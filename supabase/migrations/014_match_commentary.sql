-- ============================================================
-- Migration 014: AI match commentary storage
-- ============================================================
-- Per-match storage for admin-generated pre-game summaries and
-- post-game recaps. One row per match (upserted, not appended).
-- Users see the same cached text — generation never happens per-view.

create table match_commentary (
  match_id              uuid        primary key references matches(id) on delete cascade,
  pregame_text          text,
  pregame_status        text        not null default 'none'
                                    check (pregame_status in ('none', 'generated', 'edited')),
  pregame_generated_at  timestamptz,
  postgame_text         text,
  postgame_status       text        not null default 'none'
                                    check (postgame_status in ('none', 'generated', 'edited')),
  postgame_generated_at timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table match_commentary enable row level security;

-- All authenticated users can read (shared cached text)
create policy "commentary_select" on match_commentary
  for select to authenticated using (true);

-- Writes go through the service role only (server actions bypass RLS)

create trigger set_match_commentary_updated_at
  before update on match_commentary
  for each row execute procedure set_updated_at();
