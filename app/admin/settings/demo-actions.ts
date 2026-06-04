"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

// ── Deterministic helpers ─────────────────────────────────────────────────

/** Simple 32-bit hash for deterministic demo data. */
function hash32(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function predGoals(userIdx: number, matchIdx: number, side: number): number {
  const v = hash32(`${userIdx}-${matchIdx}-${side}`) % 14;
  return [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 0, 1][v];
}

// ── Demo constants ────────────────────────────────────────────────────────

const DEMO_DOMAIN = "wc26pool.test";

const DEMO_USERS = [
  { slug: "alice.demo",   name: "Alice Martinez"  },
  { slug: "bob.demo",     name: "Bob Thompson"    },
  { slug: "carlos.demo",  name: "Carlos Rivera"   },
  { slug: "diana.demo",   name: "Diana Chen"      },
  { slug: "eddie.demo",   name: "Eddie Walsh"     },
  { slug: "fiona.demo",   name: "Fiona Murphy"    },
  { slug: "gavin.demo",   name: "Gavin Scott"     },
  { slug: "hannah.demo",  name: "Hannah Park"     },
  { slug: "ivan.demo",    name: "Ivan Kowalski"   },
  { slug: "julia.demo",   name: "Julia Santos"    },
];

// Group match results — deterministic pattern cycling through score types
const RESULT_PATTERNS = [
  { h: 2, a: 0 }, { h: 1, a: 1 }, { h: 0, a: 1 }, { h: 3, a: 1 },
  { h: 0, a: 0 }, { h: 1, a: 0 }, { h: 0, a: 2 }, { h: 2, a: 1 },
  { h: 4, a: 1 }, { h: 1, a: 2 }, { h: 2, a: 2 }, { h: 0, a: 3 },
];

// 32 teams for the knockout stage (30 drafted + 2 undrafted)
const R32_TEAMS = [
  "ARG","FRA","ENG","ESP","BRA","POR","NED","GER",
  "COL","URU","MEX","USA","CRO","MAR","SUI","JPN",
  "SEN","ECU","KOR","AUT","NOR","AUS","CIV","SCO",
  "BEL","EGY","TUN","ALG","PAR","QAT","GHA","PAN",
];

// Draft assignments: 3 teams per user (indices into R32_TEAMS)
const DRAFT_ASSIGNMENTS: number[][] = [
  [0,  8,  16], // Alice   → ARG, COL, SEN
  [1,  9,  17], // Bob     → FRA, URU, ECU
  [2,  10, 18], // Carlos  → ENG, MEX, KOR
  [3,  11, 19], // Diana   → ESP, USA, AUT
  [4,  12, 20], // Eddie   → BRA, CRO, NOR
  [5,  13, 21], // Fiona   → POR, MAR, AUS
  [6,  14, 22], // Gavin   → NED, SUI, CIV
  [7,  15, 23], // Hannah  → GER, JPN, SCO
  [24, 25, 26], // Ivan    → BEL, EGY, TUN
  [27, 28, 29], // Julia   → ALG, PAR, QAT
];

// Efficiency picks per user
const EFFICIENCY_PICKS = [
  { player: "Lionel Messi",       team: "ARG", g: 7, a: 5, m: 720 },
  { player: "Kylian Mbappé",      team: "FRA", g: 6, a: 4, m: 630 },
  { player: "Erling Haaland",     team: "NOR", g: 8, a: 2, m: 540 },
  { player: "Jude Bellingham",    team: "ENG", g: 4, a: 6, m: 720 },
  { player: "Vinícius Jr.",       team: "BRA", g: 5, a: 4, m: 600 },
  { player: "Pedri",              team: "ESP", g: 2, a: 8, m: 660 },
  { player: "Bukayo Saka",        team: "ENG", g: 4, a: 5, m: 630 },
  { player: "Federico Valverde",  team: "URU", g: 3, a: 4, m: 720 },
  { player: "Rúben Neves",        team: "POR", g: 3, a: 3, m: 540 },
  { player: "Nicolás Domínguez",  team: "ARG", g: 2, a: 3, m: 420 },
];

// ── Load demo data ────────────────────────────────────────────────────────

export async function loadDemoData(): Promise<{ success?: boolean; error?: string; log: string[] }> {
  const service = createServiceClient();
  const log: string[] = [];

  // ── Step 1: ensure fixtures exist ──────────────────────────────────────
  const { count: matchCount } = await service
    .from("matches").select("*", { count: "exact", head: true }).eq("stage", "group");
  if (!matchCount || matchCount < 72) {
    return { error: "Import teams and fixtures first (Admin → Import).", log };
  }

  // ── Step 2: create demo auth users + profiles ──────────────────────────
  log.push("Creating demo users…");
  const demoProfiles: { id: string; auth_id: string; idx: number }[] = [];

  for (let i = 0; i < DEMO_USERS.length; i++) {
    const u = DEMO_USERS[i];
    const email = `${u.slug}@${DEMO_DOMAIN}`;

    const { data: existing } = await service
      .from("profiles").select("id, auth_id").eq("email", email).maybeSingle();

    if (existing?.auth_id) {
      demoProfiles.push({ id: existing.id, auth_id: existing.auth_id, idx: i });
      continue;
    }

    const { data: authData, error: authErr } = await service.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (authErr || !authData?.user) {
      log.push(`  ⚠ Could not create auth user for ${email}: ${authErr?.message}`);
      continue;
    }

    const { data: profile } = await service.from("profiles")
      .upsert({ email, display_name: u.name, auth_id: authData.user.id }, { onConflict: "email" })
      .select("id, auth_id").single();

    if (profile?.id) demoProfiles.push({ id: profile.id, auth_id: profile.auth_id!, idx: i });
  }
  log.push(`  ✓ ${demoProfiles.length} demo users ready`);

  if (demoProfiles.length === 0) return { error: "Could not create any demo users.", log };

  // ── Step 3: group match results ────────────────────────────────────────
  log.push("Entering group stage results…");
  const { data: groupMatches } = await service
    .from("matches").select("id").eq("stage", "group").order("kickoff_utc");

  if (groupMatches) {
    for (let i = 0; i < groupMatches.length; i++) {
      const r = RESULT_PATTERNS[i % RESULT_PATTERNS.length];
      await service.from("matches").update({
        home_goals: r.h, away_goals: r.a, status: "finished",
        went_to_et: false, went_to_shootout: false, shootout_winner: null,
      }).eq("id", groupMatches[i].id);
    }

    // Auto-populate match_stats (goals only)
    const statsRows = groupMatches.flatMap((m, i) => {
      const { data: match } = { data: null }; // will fetch below
      return [];
    });

    // Fetch with team codes to populate stats
    const { data: matchesFull } = await service
      .from("matches").select("id, home_team_code, away_team_code, home_goals, away_goals")
      .eq("stage", "group");

    if (matchesFull) {
      const allStats = matchesFull.flatMap((m) => [
        { match_id: m.id, team_code: m.home_team_code, goals: m.home_goals ?? 0, yellows: 0, second_yellows: 0, straight_reds: 0 },
        { match_id: m.id, team_code: m.away_team_code, goals: m.away_goals ?? 0, yellows: 0, second_yellows: 0, straight_reds: 0 },
      ]).filter((s) => s.team_code);

      await service.from("match_stats").upsert(allStats, { onConflict: "match_id,team_code" });
    }
  }
  log.push(`  ✓ ${groupMatches?.length ?? 0} group matches with results`);

  // ── Step 4: predictions (all 10 users × 72 group matches) ─────────────
  log.push("Generating predictions…");
  const { data: allGroupMatches } = await service
    .from("matches").select("id").eq("stage", "group").order("kickoff_utc");

  if (allGroupMatches && demoProfiles.length > 0) {
    const predictions = demoProfiles.flatMap((p) =>
      allGroupMatches.map((m, mi) => ({
        user_id: p.auth_id,
        match_id: m.id,
        home_goals_pred: predGoals(p.idx, mi, 0),
        away_goals_pred: predGoals(p.idx, mi, 1),
      }))
    );
    await service.from("predictions").upsert(predictions, { onConflict: "user_id,match_id", ignoreDuplicates: true });
  }
  log.push(`  ✓ ${(allGroupMatches?.length ?? 0) * demoProfiles.length} predictions`);

  // ── Step 5: draft preferences ──────────────────────────────────────────
  log.push("Adding draft preferences…");
  const { data: allTeams } = await service.from("teams").select("fifa_code").order("group_letter").order("name");
  const teamCodes = (allTeams ?? []).map((t) => t.fifa_code);

  const prefRows = demoProfiles.map((p) => ({
    profile_id: p.id,
    preferred_position: (p.idx % 10) + 1,
    position_preferences: Array.from({ length: 10 }, (_, i) => ((p.idx + i) % 10) + 1),
    team_wishlist: teamCodes.slice(p.idx * 4, p.idx * 4 + 10).concat(
      teamCodes.filter((_, i) => i < p.idx * 4 || i >= p.idx * 4 + 10)
    ),
    notes: ["I want position 1 if possible!", null, "Going for the big teams.", null,
      "Happy with any mid-range position.", null, "Last pick = best value picks!", null,
      "My spreadsheet says pick 8 is optimal.", null][p.idx] ?? null,
  }));
  await service.from("draft_preferences").upsert(prefRows, { onConflict: "profile_id", ignoreDuplicates: true });
  log.push(`  ✓ ${prefRows.length} draft preferences`);

  // ── Step 6: draft picks ────────────────────────────────────────────────
  log.push("Assigning draft picks…");
  const { data: teams48 } = await service.from("teams").select("id, fifa_code");
  const teamIdByCode: Record<string, string> = Object.fromEntries(
    (teams48 ?? []).map((t) => [t.fifa_code, t.id])
  );

  const draftRows = demoProfiles.flatMap((p) =>
    (DRAFT_ASSIGNMENTS[p.idx] ?? []).map((teamIdx, pickN) => ({
      profile_id: p.id,
      team_id: teamIdByCode[R32_TEAMS[teamIdx]] ?? null,
      pick_number: pickN + 1,
    }))
  ).filter((r) => r.team_id);

  await service.from("drafts").upsert(draftRows, { onConflict: "profile_id,team_id", ignoreDuplicates: true });
  await service.from("settings").update({ draft_locked: true }).eq("singleton", true);
  log.push(`  ✓ ${draftRows.length} draft picks (draft locked)`);

  // ── Step 7: knockout matches ───────────────────────────────────────────
  log.push("Creating R32 knockout matches…");
  const r32Pairs = [
    ["ARG","CRO"], ["FRA","MAR"], ["ENG","SEN"], ["ESP","JPN"],
    ["BRA","AUS"], ["POR","KOR"], ["NED","USA"], ["GER","MEX"],
    ["COL","SUI"], ["URU","CIV"], ["ECU","SCO"], ["NOR","BEL"],
    ["AUT","EGY"], ["ALG","GHA"], ["PAR","TUN"], ["QAT","PAN"],
  ];
  const r32Results = [
    {h:2,a:0}, {h:1,a:2}, {h:3,a:1}, {h:0,a:1},
    {h:1,a:0}, {h:2,a:1}, {h:1,a:1,et:true,shoot:true,sw:"home"}, {h:0,a:1},
    null, null, null, null, null, null, null, null, // these are unplayed
  ] as ({ h: number; a: number; et?: boolean; shoot?: boolean; sw?: string } | null)[];

  const kickoffBase = new Date("2026-06-28T19:00:00Z").getTime();
  const r32MatchRows = r32Pairs.map(([home, away], i) => ({
    stage: "r32",
    home_team_code: home,
    away_team_code: away,
    kickoff_utc: new Date(kickoffBase + i * 6 * 3600 * 1000).toISOString(),
    status: r32Results[i] ? "finished" : "scheduled",
    home_goals: r32Results[i]?.h ?? null,
    away_goals: r32Results[i]?.a ?? null,
    went_to_et: r32Results[i]?.et ?? false,
    went_to_shootout: r32Results[i]?.shoot ?? false,
    shootout_winner: r32Results[i]?.sw ?? null,
  }));

  // Only insert if not already there
  for (const row of r32MatchRows) {
    await service.from("matches").upsert(row, { onConflict: "home_team_code,away_team_code", ignoreDuplicates: false });
  }

  // Match stats for finished R32
  const { data: r32Finished } = await service.from("matches")
    .select("id, home_team_code, away_team_code, home_goals, away_goals")
    .eq("stage", "r32").eq("status", "finished");

  if (r32Finished) {
    const r32Stats = r32Finished.flatMap((m) => [
      { match_id: m.id, team_code: m.home_team_code, goals: m.home_goals ?? 0, yellows: 1, second_yellows: 0, straight_reds: 0 },
      { match_id: m.id, team_code: m.away_team_code, goals: m.away_goals ?? 0, yellows: 0, second_yellows: 0, straight_reds: 0 },
    ]).filter((s) => s.team_code);
    await service.from("match_stats").upsert(r32Stats, { onConflict: "match_id,team_code" });
  }
  log.push(`  ✓ 16 R32 matches (8 with results)`);

  // ── Step 8: efficiency picks ───────────────────────────────────────────
  log.push("Adding efficiency picks…");
  const effRows = demoProfiles.map((p) => {
    const ep = EFFICIENCY_PICKS[p.idx];
    return {
      profile_id: p.id,
      player_name: ep.player,
      team_code: ep.team,
      goals: ep.g,
      assists: ep.a,
      minutes: ep.m,
    };
  });
  await service.from("efficiency_picks").upsert(effRows, { onConflict: "profile_id", ignoreDuplicates: true });
  log.push(`  ✓ ${effRows.length} efficiency picks`);

  // ── Step 9: set phase to knockout ─────────────────────────────────────
  await service.from("settings")
    .update({ current_phase_override: "knockout" })
    .eq("singleton", true);
  log.push("  ✓ Phase set to 'knockout'");

  revalidatePath("/");
  revalidatePath("/admin");
  log.push("Done! Use Admin → Settings → Phase Override to switch between phases.");
  return { success: true, log };
}

// ── Clear demo data ───────────────────────────────────────────────────────

export async function clearDemoData(): Promise<{ success?: boolean; error?: string; log: string[] }> {
  const service = createServiceClient();
  const log: string[] = [];

  log.push("Finding demo profiles…");
  const { data: demoProfiles } = await service
    .from("profiles").select("id, auth_id, email").ilike("email", `%@${DEMO_DOMAIN}`);

  // Delete predictions for demo users (not cascade-deleted)
  for (const p of demoProfiles ?? []) {
    if (p.auth_id) {
      await service.from("predictions").delete().eq("user_id", p.auth_id);
    }
  }

  // Delete demo auth users (profiles have on-delete-set-null so auth_id becomes null)
  let deletedUsers = 0;
  for (const p of demoProfiles ?? []) {
    if (p.auth_id) {
      await service.auth.admin.deleteUser(p.auth_id);
      deletedUsers++;
    }
  }

  // Delete demo profiles (auth_id now null; delete explicitly)
  for (const p of demoProfiles ?? []) {
    await service.from("profiles").delete().eq("id", p.id);
  }
  log.push(`  ✓ ${deletedUsers} demo users removed`);

  // Reset all group match results
  await service.from("matches").update({
    home_goals: null, away_goals: null, status: "scheduled",
    went_to_et: false, went_to_shootout: false, shootout_winner: null,
  }).eq("stage", "group");

  // Delete knockout matches (created by demo)
  await service.from("matches").delete().neq("stage", "group");
  log.push("  ✓ Match results reset");

  // Clear stats, events
  await service.from("match_stats").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await service.from("penalty_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await service.from("efficiency_picks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push("  ✓ Stats and events cleared");

  // Reset settings
  await service.from("settings").update({
    draft_locked: false,
    current_phase_override: null,
  }).eq("singleton", true);
  log.push("  ✓ Settings reset (phase = auto-detect, draft unlocked)");

  revalidatePath("/");
  revalidatePath("/admin");
  log.push("Done. Database is clean.");
  return { success: true, log };
}
