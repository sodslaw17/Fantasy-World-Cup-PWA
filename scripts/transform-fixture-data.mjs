/**
 * Transforms the raw WC Fixtures CSVs into the format expected by the app importer.
 * Run: node scripts/transform-fixture-data.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = "/Users/jcro/Documents/Claude Code/WC Fixtures";

// ── Helpers ────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function toUTC(localWithOffset) {
  // e.g. "2026-06-11 15:00:00-06" → "2026-06-11T21:00:00.000Z"
  const iso = localWithOffset.trim().replace(" ", "T");
  // Pad offset to ±HH:MM if needed (e.g. -06 → -06:00)
  const normalised = iso.replace(/([+-]\d{2})$/, "$1:00");
  return new Date(normalised).toISOString().replace(/\.\d{3}Z$/, "Z");
}

// ── Load source files ──────────────────────────────────────────────────────

const rawTeams    = parseCSV(readFileSync(join(SRC, "2026 World Cup Fixture Data - teams.csv"),   "utf8"));
const rawMatches  = parseCSV(readFileSync(join(SRC, "2026 World Cup Fixture Data - matches.csv"), "utf8"));

// ── Transform teams ────────────────────────────────────────────────────────

const teams = rawTeams.map((r) => ({
  fifa_code:    r.fifa_code.trim().toUpperCase(),
  name:         r.team_name.trim(),
  group_letter: r.group_letter.trim().toUpperCase(),
  flag_url:     "",
}));

// Build id → fifa_code lookup for fixture transform
const idToCode = Object.fromEntries(rawTeams.map((r) => [r.id, r.fifa_code.trim().toUpperCase()]));

// ── Transform fixtures (group stage only: stage_id = "1") ─────────────────

const fixtures = rawMatches
  .filter((r) => r.stage_id === "1")
  .map((r) => ({
    group_letter:   r.match_label.trim().replace("Group ", "").toUpperCase(),
    home_team_code: idToCode[r.home_team_id],
    away_team_code: idToCode[r.away_team_id],
    kickoff_utc:    toUTC(r.kickoff_at),
  }));

// ── Validation ─────────────────────────────────────────────────────────────

const invalidTeams = teams.filter((t) => !t.fifa_code || !t.name || !/^[A-L]$/.test(t.group_letter));
if (invalidTeams.length) {
  console.error("⚠ Invalid team rows:", invalidTeams);
  process.exit(1);
}

const invalidFixtures = fixtures.filter(
  (f) => !f.home_team_code || !f.away_team_code || !f.group_letter || isNaN(Date.parse(f.kickoff_utc))
);
if (invalidFixtures.length) {
  console.error("⚠ Invalid fixture rows:", invalidFixtures);
  process.exit(1);
}

// ── Write output CSVs ──────────────────────────────────────────────────────

function toCSV(rows) {
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => r[h]).join(","))];
  return lines.join("\n") + "\n";
}

const teamsOut    = join(ROOT, "supabase/sample-data/teams.csv");
const fixturesOut = join(ROOT, "supabase/sample-data/fixtures.csv");

writeFileSync(teamsOut,    toCSV(teams));
writeFileSync(fixturesOut, toCSV(fixtures));

console.log(`✓ ${teams.length} teams written to    ${teamsOut}`);
console.log(`✓ ${fixtures.length} fixtures written to ${fixturesOut}`);

// Quick sanity checks
const groupCounts = {};
teams.forEach((t) => { groupCounts[t.group_letter] = (groupCounts[t.group_letter] || 0) + 1; });
const badGroups = Object.entries(groupCounts).filter(([, n]) => n !== 4);
if (badGroups.length) console.warn("⚠ Groups without exactly 4 teams:", badGroups);
else console.log("✓ All 12 groups have exactly 4 teams");

if (fixtures.length !== 72) console.warn(`⚠ Expected 72 fixtures, got ${fixtures.length}`);
else console.log("✓ 72 group-stage fixtures");
