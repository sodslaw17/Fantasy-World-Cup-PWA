"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { parseCSV } from "@/lib/csv";

interface ImportResult {
  success?: boolean;
  count?: number;
  error?: string;
}

// ── Teams ──────────────────────────────────────────────────────────────────

export async function importTeams(csv: string): Promise<ImportResult> {
  const rows = parseCSV(csv);
  if (rows.length === 0) return { error: "No data rows found in CSV." };

  const required = ["fifa_code", "name", "group_letter"];
  const missing = required.filter((h) => !(h in rows[0]));
  if (missing.length > 0)
    return { error: `Missing columns: ${missing.join(", ")}` };

  const teams = rows.map((r) => ({
    fifa_code: r.fifa_code.toUpperCase(),
    name: r.name,
    group_letter: r.group_letter.toUpperCase() || null,
    flag_url: r.flag_url || null,
  }));

  const invalid = teams.filter(
    (t) => !t.fifa_code || !t.name || (t.group_letter && !/^[A-L]$/.test(t.group_letter))
  );
  if (invalid.length > 0)
    return {
      error: `${invalid.length} row(s) have invalid data. Check fifa_code, name, and group_letter (A–L).`,
    };

  const service = createServiceClient();
  const { error } = await service
    .from("teams")
    .upsert(teams, { onConflict: "fifa_code" });

  if (error) return { error: error.message };

  revalidatePath("/admin/import");
  return { success: true, count: teams.length };
}

// ── Fixtures ───────────────────────────────────────────────────────────────

export async function importFixtures(csv: string): Promise<ImportResult> {
  const rows = parseCSV(csv);
  if (rows.length === 0) return { error: "No data rows found in CSV." };

  const required = ["group_letter", "home_team_code", "away_team_code", "kickoff_utc"];
  const missing = required.filter((h) => !(h in rows[0]));
  if (missing.length > 0)
    return { error: `Missing columns: ${missing.join(", ")}` };

  const fixtures = rows.map((r) => ({
    stage: "group" as const,
    group_letter: r.group_letter.toUpperCase(),
    home_team_code: r.home_team_code.toUpperCase(),
    away_team_code: r.away_team_code.toUpperCase(),
    kickoff_utc: r.kickoff_utc,
  }));

  // Basic validation
  const invalid = fixtures.filter(
    (f) =>
      !/^[A-L]$/.test(f.group_letter) ||
      !f.home_team_code ||
      !f.away_team_code ||
      f.home_team_code === f.away_team_code ||
      isNaN(Date.parse(f.kickoff_utc))
  );
  if (invalid.length > 0)
    return {
      error: `${invalid.length} row(s) have invalid data. Check group_letter (A–L), team codes, and kickoff_utc (ISO-8601).`,
    };

  // Verify all team codes exist
  const service = createServiceClient();
  const codes = [...new Set(fixtures.flatMap((f) => [f.home_team_code, f.away_team_code]))];
  const { data: existingTeams } = await service
    .from("teams")
    .select("fifa_code")
    .in("fifa_code", codes);

  const existingCodes = new Set((existingTeams ?? []).map((t) => t.fifa_code));
  const unknown = codes.filter((c) => !existingCodes.has(c));
  if (unknown.length > 0)
    return {
      error: `Unknown team codes (import teams first): ${unknown.join(", ")}`,
    };

  // Upsert on (home_team_code, away_team_code) — preserves any entered results
  const { error } = await service.from("matches").upsert(fixtures, {
    onConflict: "home_team_code,away_team_code",
    ignoreDuplicates: false,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/import");
  return { success: true, count: fixtures.length };
}
