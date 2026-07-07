-- ============================================================
-- Migration 013: Team color columns for per-user theming
-- ------------------------------------------------------------
-- Adds theme_primary_hex / theme_secondary_hex to the teams
-- table. These are read by layout.tsx → BrandProvider →
-- computeBrand() to derive per-user brand tokens via HSL.
-- Run this once in the Supabase Dashboard SQL editor, then
-- run: node scripts/seed-team-colors.mjs
-- ============================================================

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS theme_primary_hex   TEXT,
  ADD COLUMN IF NOT EXISTS theme_secondary_hex TEXT;
