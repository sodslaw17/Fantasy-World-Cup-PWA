-- Migration 005: store full ranked position preferences (replaces single int)
alter table draft_preferences
  add column if not exists position_preferences int[];
