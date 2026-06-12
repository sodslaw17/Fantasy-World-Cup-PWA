-- Migration 006: store each user's IANA timezone for correct "today" date windows

alter table profiles
  add column if not exists timezone text;
