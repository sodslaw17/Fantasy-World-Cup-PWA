import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentPhase } from "@/lib/phase";
import { computeLeaderboard } from "@/lib/scoring/leaderboard";
import { computeOverallLeaderboard } from "@/lib/scoring/overall";
import { StandbyScreen } from "@/components/draft/StandbyScreen";
import { StandingsScreen, type StandingRow, type EffRow, type DiscRow } from "@/components/standings/StandingsScreen";
import { isAdmin } from "@/lib/auth/roles";
import { computeEfficiencyLeaderboard, computeDisciplineLeaderboard, computeCardPoints } from "@/lib/scoring/sidepots";
import type { Settings, Match } from "@/lib/db";
import type { KnockoutMatch } from "@/lib/scoring/knockout";
import { scoreKnockoutMatch, scorePenaltyEvent } from "@/lib/scoring/knockout";

export const metadata = { title: "WC26 Pool" };

import { nameToColor } from "@/lib/name-color";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const admin = isAdmin(user.email ?? "");

  const [{ data: settings }, { data: profiles }, { data: allMatches }, { data: predictions }, { data: effPicks }] =
    await Promise.all([
      service.from("settings").select("*").single(),
      service.from("profiles").select("id, display_name, auth_id, avatar_url"),
      service.from("matches").select("*").order("kickoff_utc"),
      service.from("predictions").select("user_id, match_id, home_goals_pred, away_goals_pred"),
      service.from("efficiency_picks").select("*"),
    ]);

  const s = settings as Settings | null;
  const phase = s ? getCurrentPhase(s) : "predictions";
  const groupMatches = (allMatches ?? []).filter((m: Match) => m.stage === "group");
  const knockoutMatches = (allMatches ?? []).filter((m: Match) => m.stage !== "group");

  // ── Draft standby ──────────────────────────────────────────────────────────
  if (phase === "draft_standby") {
    const groupLeaderboard = computeLeaderboard(profiles ?? [], groupMatches, predictions ?? []);
    const myEntry = groupLeaderboard.find((e) => e.authId === user.id);
    const draftPosition = myEntry?.rank ?? groupLeaderboard.length;
    // Use knockout_start_utc as draft countdown target; fall back to +7 days if not set
    const draftAtISO = s?.knockout_start_utc ?? new Date(Date.now() + 7 * 86_400_000).toISOString();

    return (
      <StandbyScreen
        draftAtISO={draftAtISO}
        standbyBody={s?.draft_standby_text ?? "Standby for your draft picks."}
        draftPosition={draftPosition}
        teamCount={3}
      />
    );
  }

  // ── Knockout phase ─────────────────────────────────────────────────────────
  if (phase === "knockout") {
    const [{ data: drafts }, { data: teams }, { data: penaltyEvents }, { data: matchStats }] = await Promise.all([
      service.from("drafts").select("profile_id, team_id, teams(fifa_code)"),
      service.from("teams").select("id, fifa_code, name, custom_icon_url"),
      service.from("penalty_events").select("match_id, team_code, type"),
      service.from("match_stats").select("team_code, yellows, second_yellows, straight_reds"),
    ]);

    const draftRows = (drafts ?? []).map((d: { profile_id: string; team_id: string; teams: { fifa_code: string } | { fifa_code: string }[] | null }) => ({
      profile_id: d.profile_id,
      team_code: (Array.isArray(d.teams) ? d.teams[0]?.fifa_code : d.teams?.fifa_code) ?? "",
    }));

    const teamByCode: Record<string, { name: string; custom_icon_url: string | null }> =
      Object.fromEntries((teams ?? []).map((t: { fifa_code: string; name: string; custom_icon_url: string | null }) => [t.fifa_code, t]));

    const overallBoard = computeOverallLeaderboard(
      profiles ?? [],
      groupMatches,
      predictions ?? [],
      draftRows,
      knockoutMatches.map((m: Match) => ({
        ...m,
        home_goals: m.home_goals ?? 0,
        away_goals: m.away_goals ?? 0,
      })) as KnockoutMatch[],
      penaltyEvents ?? []
    );

    // Efficiency leaderboard — map over ALL profiles so users without a pick still appear
    const koEffEntries = computeEfficiencyLeaderboard(
      (profiles ?? []).map((prof) => {
        const pick = (effPicks ?? []).find((p) => p.profile_id === prof.id);
        return {
          profileId: prof.id,
          displayName: (prof as { display_name?: string }).display_name ?? "Unknown",
          playerName: pick?.player_name ?? "",
          teamCode: pick?.team_code ?? null,
          goals: pick?.goals ?? 0,
          assists: pick?.assists ?? 0,
          minutes: pick?.minutes ?? 0,
        };
      })
    ).map((e) => {
      const prof = (profiles ?? []).find((pr: { id: string }) => pr.id === e.profileId) as { auth_id: string | null; avatar_url: string | null } | undefined;
      return {
        ...e,
        userAvatarUrl: prof?.avatar_url ?? null,
        playerPhotoUrl: (effPicks ?? []).find((ep) => ep.profile_id === e.profileId)?.player_photo_url ?? null,
      };
    });

    // Discipline leaderboard
    const disciplineEntries = computeDisciplineLeaderboard(profiles ?? [], draftRows, matchStats ?? []);

    // Teams knocked out: lost a knockout match OR never made the knockout stage
    const knockoutParticipants = new Set<string>();
    const eliminatedCodes = new Set<string>();
    for (const m of knockoutMatches as Match[]) {
      if (m.home_team_code) knockoutParticipants.add(m.home_team_code);
      if (m.away_team_code) knockoutParticipants.add(m.away_team_code);
      if (m.home_goals == null || m.away_goals == null) continue;
      const winner = m.home_goals > m.away_goals ? m.home_team_code
        : m.away_goals > m.home_goals ? m.away_team_code
        : m.shootout_winner === 'home' ? m.home_team_code
        : m.shootout_winner === 'away' ? m.away_team_code
        : null;
      const loser = winner === m.home_team_code ? m.away_team_code
        : winner === m.away_team_code ? m.home_team_code : null;
      if (loser) eliminatedCodes.add(loser);
    }
    // Any team not in any knockout match is group-stage eliminated
    if (knockoutParticipants.size > 0) {
      for (const t of (teams ?? [])) {
        if (!knockoutParticipants.has(t.fifa_code)) eliminatedCodes.add(t.fifa_code);
      }
    }

    // Build per-profile team index and per-team point totals for team chips
    const draftByProfile: Record<string, string[]> = {};
    for (const d of draftRows) {
      (draftByProfile[d.profile_id] ??= []).push(d.team_code);
    }

    // Per-team knockout points (matches + penalty events)
    const teamKoPts: Record<string, number> = {};
    const finishedKO = knockoutMatches.filter((m: Match) => m.status === "finished");
    for (const m of finishedKO) {
      const km = { ...m, home_goals: m.home_goals ?? 0, away_goals: m.away_goals ?? 0 } as KnockoutMatch;
      for (const code of [m.home_team_code, m.away_team_code].filter(Boolean) as string[]) {
        teamKoPts[code] = (teamKoPts[code] ?? 0) + scoreKnockoutMatch(km, code);
      }
    }
    for (const e of penaltyEvents ?? []) {
      teamKoPts[e.team_code] = (teamKoPts[e.team_code] ?? 0) + scorePenaltyEvent(e.type as import("@/lib/scoring/knockout").PenaltyEventType);
    }

    // Per-team card points
    const teamCardPts: Record<string, number> = {};
    for (const ms of matchStats ?? []) {
      teamCardPts[ms.team_code] = (teamCardPts[ms.team_code] ?? 0) +
        computeCardPoints(ms.yellows, ms.second_yellows, ms.straight_reds);
    }

    // Build StandingsScreen rows
    const pointsRows: StandingRow[] = overallBoard.map((e) => ({
      id: e.profileId,
      name: e.displayName,
      color: nameToColor(e.displayName),
      avatarUrl: (profiles ?? []).find((p: { id: string }) => p.id === e.profileId)?.avatar_url ?? null,
      you: e.authId === user.id,
      value: e.totalPoints,
      teams: (draftByProfile[e.profileId] ?? []).map((code) => ({
        code,
        name: teamByCode[code]?.name ?? code,
        logoUrl: teamByCode[code]?.custom_icon_url ?? null,
        pts: teamKoPts[code] ?? 0,
        eliminated: eliminatedCodes.has(code),
      })),
    }));

    const effTeamByProfile: Record<string, string | null> = Object.fromEntries(
      (effPicks ?? []).map((ep) => [ep.profile_id, ep.team_code ?? null])
    );
    const effRows: EffRow[] = koEffEntries.map((e) => {
      const prof = (profiles ?? []).find((p: { id: string }) => p.id === e.profileId);
      const effTeamCode = effTeamByProfile[e.profileId] ?? null;
      return {
        id: e.profileId,
        playerName: e.playerName || "TBD",
        iconUrl: e.playerPhotoUrl,
        ownerName: e.displayName,
        ownerColor: nameToColor(e.displayName),
        you: (prof as { auth_id?: string | null } | undefined)?.auth_id === user.id,
        rate: e.efficiency,
        g: e.goals,
        a: e.assists,
        min: e.minutes,
        teamEliminated: effTeamCode ? eliminatedCodes.has(effTeamCode) : false,
      };
    });

    const discRows: DiscRow[] = disciplineEntries.map((e) => ({
      id: e.profileId,
      name: e.displayName,
      color: nameToColor(e.displayName),
      avatarUrl: (profiles ?? []).find((p: { id: string }) => p.id === e.profileId)?.avatar_url ?? null,
      you: overallBoard.find((o) => o.profileId === e.profileId)?.authId === user.id,
      cardPts: e.totalCardPoints,
      teams: e.teamCodes.map((code) => ({
        code,
        name: teamByCode[code]?.name ?? code,
        logoUrl: teamByCode[code]?.custom_icon_url ?? null,
        pts: teamCardPts[code] ?? 0,
        eliminated: eliminatedCodes.has(code),
      })),
    }));

    return (
      <StandingsScreen
        playerCount={overallBoard.length}
        combined={true}
        pointsRows={pointsRows}
        effRows={effRows}
        discRows={discRows}
        isAdmin={admin}
      />
    );
  }

  // ── Group / predictions phase ──────────────────────────────────────────────
  const leaderboard = computeLeaderboard(profiles ?? [], groupMatches, predictions ?? []);
  const totalMatches = groupMatches.length;
  const finishedMatches = groupMatches.filter((m: Match) => m.status === "finished").length;

  // Efficiency leaderboard — map over ALL profiles so users without a pick still appear
  const effEntries = computeEfficiencyLeaderboard(
    (profiles ?? []).map((prof) => {
      const pick = (effPicks ?? []).find((p) => p.profile_id === prof.id);
      return {
        profileId: prof.id,
        displayName: (prof as { display_name?: string }).display_name ?? "Unknown",
        playerName: pick?.player_name ?? "",
        teamCode: pick?.team_code ?? null,
        goals: pick?.goals ?? 0,
        assists: pick?.assists ?? 0,
        minutes: pick?.minutes ?? 0,
      };
    })
  ).map((e) => {
    const prof = (profiles ?? []).find((pr: { id: string }) => pr.id === e.profileId) as { auth_id: string | null; avatar_url: string | null } | undefined;
    return { ...e, userAvatarUrl: prof?.avatar_url ?? null, playerPhotoUrl: (effPicks ?? []).find((ep) => ep.profile_id === e.profileId)?.player_photo_url ?? null };
  });

  // Build StandingsScreen rows
  const pointsRows: StandingRow[] = leaderboard.map((e) => ({
    id: e.profileId,
    name: e.displayName,
    color: nameToColor(e.displayName),
    avatarUrl: (profiles ?? []).find((p: { id: string; auth_id: string | null }) => p.auth_id === e.authId)?.avatar_url ?? null,
    you: e.authId === user.id,
    value: e.points,
  }));

  const effRows: EffRow[] = effEntries.map((e) => {
    const prof = (profiles ?? []).find((p: { id: string }) => p.id === e.profileId);
    return {
      id: e.profileId,
      playerName: e.playerName || "TBD",
      iconUrl: e.playerPhotoUrl,
      ownerName: e.displayName,
      ownerColor: nameToColor(e.displayName),
      you: (prof as { auth_id?: string | null } | undefined)?.auth_id === user.id,
      rate: e.efficiency,
      g: e.goals,
      a: e.assists,
      min: e.minutes,
    };
  });

  return (
    <StandingsScreen
      playerCount={leaderboard.length}
      combined={false}
      pointsRows={pointsRows}
      effRows={effRows}
      isAdmin={admin}
    />
  );
}
