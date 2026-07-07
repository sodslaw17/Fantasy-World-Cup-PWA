import { createServiceClient } from "@/lib/supabase/service";
import { SidePotsTabs } from "@/components/admin/sidepots/SidePotsTabs";
import { EfficiencyManager } from "@/components/admin/sidepots/EfficiencyManager";
import { CardsManager } from "@/components/admin/sidepots/CardsManager";
import { PenaltyManager } from "@/components/admin/sidepots/PenaltyManager";
import { AdminPageHeader } from "../_components/AdminShell";
import type { Match } from "@/lib/db";

export const metadata = { title: "Side Pots — WC26 Admin" };

export default async function SidePotsPage() {
  const service = createServiceClient();

  const [
    { data: profiles },
    { data: effPicks },
    { data: effMatchStats },
    { data: koMatches },
    { data: matchStats },
    { data: penaltyEvents },
    { data: teams },
  ] = await Promise.all([
    service.from("profiles").select("id, display_name").order("display_name"),
    service.from("efficiency_picks").select("id, profile_id, player_name, team_code, player_photo_url, goals, assists, minutes"),
    service.from("efficiency_match_stats").select("id, efficiency_pick_id, match_id, is_prior_total, goals, assists, minutes"),
    service.from("matches").select("*").order("kickoff_utc"),
    service.from("match_stats").select("match_id, team_code, yellows, second_yellows, straight_reds, yellows_auto, second_yellows_auto, straight_reds_auto, yellows_manual, second_yellows_manual, straight_reds_manual, last_synced_at"),
    service.from("penalty_events").select("*"),
    service.from("teams").select("fifa_code, name"),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

  const allMatches = (koMatches ?? []) as Match[];

  const effPickMap: Record<string, typeof effPicks extends (infer T)[] | null ? T : never> =
    Object.fromEntries((effPicks ?? []).map((p) => [p.profile_id, p]));

  function matchLabel(m: Match): string {
    const home = teamNames[m.home_team_code ?? ""] ?? m.home_team_code ?? "TBD";
    const away = teamNames[m.away_team_code ?? ""] ?? m.away_team_code ?? "TBD";
    const date = new Date(m.kickoff_utc).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${home} vs ${away} — ${date}`;
  }

  const players = (profiles ?? []).map((p) => {
    const pick = effPickMap[p.id] ?? null;
    if (!pick) return { profileId: p.id, displayName: p.display_name, pick: null };

    const statsForPick = (effMatchStats ?? []).filter((s) => s.efficiency_pick_id === pick.id);
    const statByMatchId = Object.fromEntries(
      statsForPick.filter((s) => s.match_id).map((s) => [s.match_id as string, s])
    );
    const priorTotal = statsForPick.find((s) => s.is_prior_total) ?? null;

    // Auto-populate one row per match already played by the pick's team.
    const teamMatches = pick.team_code
      ? allMatches
          .filter((m) => m.home_team_code === pick.team_code || m.away_team_code === pick.team_code)
          .sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))
      : [];

    const rows = teamMatches.map((m) => {
      const existing = statByMatchId[m.id];
      return {
        rowId: existing?.id ?? null,
        matchId: m.id,
        label: matchLabel(m),
        goals: existing?.goals ?? 0,
        assists: existing?.assists ?? 0,
        minutes: existing?.minutes ?? 0,
        isAuto: true,
      };
    });

    // Rows saved against a match no longer in the auto-populated list
    // (e.g. team_code changed after entry, or manually added) — keep them
    // visible, not silently dropped, and let the admin delete them.
    const teamMatchIds = new Set(teamMatches.map((m) => m.id));
    for (const s of statsForPick) {
      if (!s.match_id || teamMatchIds.has(s.match_id)) continue;
      const m = allMatches.find((mm) => mm.id === s.match_id);
      rows.push({
        rowId: s.id,
        matchId: s.match_id,
        label: m ? matchLabel(m) : "Unknown match",
        goals: s.goals, assists: s.assists, minutes: s.minutes,
        isAuto: false,
      });
    }

    const otherMatches = allMatches
      .filter((m) => !teamMatchIds.has(m.id) && !statsForPick.some((s) => s.match_id === m.id))
      .map((m) => ({ id: m.id, label: matchLabel(m) }));

    return {
      profileId: p.id,
      displayName: p.display_name,
      pick: {
        id: pick.id,
        playerName: pick.player_name, teamCode: pick.team_code,
        playerPhotoUrl: pick.player_photo_url ?? null,
        goals: pick.goals, assists: pick.assists, minutes: pick.minutes,
        priorTotal: priorTotal
          ? { rowId: priorTotal.id, goals: priorTotal.goals, assists: priorTotal.assists, minutes: priorTotal.minutes }
          : null,
        rows,
        otherMatches,
      },
    };
  });

  const statsMap = Object.fromEntries(
    (matchStats ?? []).map((s) => [`${s.match_id}-${s.team_code}`, s])
  );

  const finishedKO = ((koMatches ?? []) as Match[]).map((m) => ({
    ...m,
    homeTeamName: teamNames[m.home_team_code ?? ""] ?? m.home_team_code ?? "TBD",
    awayTeamName: teamNames[m.away_team_code ?? ""] ?? m.away_team_code ?? "TBD",
    homeStats: m.home_team_code ? (statsMap[`${m.id}-${m.home_team_code}`] ?? null) : null,
    awayStats: m.away_team_code ? (statsMap[`${m.id}-${m.away_team_code}`] ?? null) : null,
  }));

  const penaltyMatches = ((koMatches ?? []) as Match[])
    .map((m) => ({
      id: m.id,
      homeTeamName: teamNames[m.home_team_code ?? ""] ?? "TBD",
      awayTeamName: teamNames[m.away_team_code ?? ""] ?? "TBD",
      homeCode: m.home_team_code ?? "",
      awayCode: m.away_team_code ?? "",
      kickoffUtc: m.kickoff_utc,
      events: (penaltyEvents ?? [])
        .filter((e) => e.match_id === m.id)
        .map((e) => ({
          id: e.id,
          teamCode: e.team_code,
          playerName: e.player_name,
          type: e.type,
        })),
    }));

  return (
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader
        title="Side Pots"
        sub="Efficiency (1st pot · $30) · Discipline (2nd pot · $30) · Penalty events"
      />
      <div className="px-4 pb-8">
        <SidePotsTabs
          efficiencyTab={<EfficiencyManager players={players} />}
          cardsTab={<CardsManager matches={finishedKO} />}
          penaltiesTab={<PenaltyManager matches={penaltyMatches} />}
        />
      </div>
    </div>
  );
}
