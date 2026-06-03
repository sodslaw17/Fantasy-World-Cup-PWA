import { createServiceClient } from "@/lib/supabase/service";
import { SidePotsTabs } from "@/components/admin/sidepots/SidePotsTabs";
import { EfficiencyManager } from "@/components/admin/sidepots/EfficiencyManager";
import { CardsManager } from "@/components/admin/sidepots/CardsManager";
import { PenaltyManager } from "@/components/admin/sidepots/PenaltyManager";
import type { Match } from "@/lib/db";

export const metadata = { title: "Side Pots — WC26 Admin" };

export default async function SidePotsPage() {
  const service = createServiceClient();

  const [
    { data: profiles },
    { data: effPicks },
    { data: koMatches },
    { data: matchStats },
    { data: penaltyEvents },
    { data: teams },
  ] = await Promise.all([
    service.from("profiles").select("id, display_name").order("display_name"),
    service.from("efficiency_picks").select("*"),
    service.from("matches").select("*").neq("stage", "group").order("kickoff_utc"),
    service.from("match_stats").select("*"),
    service.from("penalty_events").select("*"),
    service.from("teams").select("fifa_code, name"),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

  const effPickMap: Record<string, typeof effPicks extends (infer T)[] | null ? T : never> =
    Object.fromEntries((effPicks ?? []).map((p) => [p.profile_id, p]));

  // Build efficiency player data
  const players = (profiles ?? []).map((p) => {
    const pick = effPickMap[p.id] ?? null;
    return {
      profileId: p.id,
      displayName: p.display_name,
      pick: pick
        ? { playerName: pick.player_name, teamCode: pick.team_code,
            goals: pick.goals, assists: pick.assists, minutes: pick.minutes }
        : null,
    };
  });

  // Build card entry data — only finished knockout matches
  const statsMap: Record<string, { yellows: number; second_yellows: number; straight_reds: number }> =
    Object.fromEntries((matchStats ?? []).map((s) => [`${s.match_id}-${s.team_code}`, s]));

  const finishedKO = ((koMatches ?? []) as Match[]).map((m) => ({
    ...m,
    homeTeamName: teamNames[m.home_team_code ?? ""] ?? m.home_team_code ?? "TBD",
    awayTeamName: teamNames[m.away_team_code ?? ""] ?? m.away_team_code ?? "TBD",
    homeStats: m.home_team_code ? (statsMap[`${m.id}-${m.home_team_code}`] ?? null) : null,
    awayStats: m.away_team_code ? (statsMap[`${m.id}-${m.away_team_code}`] ?? null) : null,
  }));

  // Penalty shootout matches + their events
  const shootoutMatches = ((koMatches ?? []) as Match[])
    .filter((m) => m.went_to_shootout)
    .map((m) => ({
      id: m.id,
      homeTeamName: teamNames[m.home_team_code ?? ""] ?? "TBD",
      awayTeamName: teamNames[m.away_team_code ?? ""] ?? "TBD",
      homeCode: m.home_team_code ?? "",
      awayCode: m.away_team_code ?? "",
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
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gold mb-1">Side Pots</h1>
      <p className="text-sm text-paper/50 mb-5">
        Efficiency (1st pot · $30) · Discipline (2nd pot · $30) · Penalty events
      </p>
      <SidePotsTabs
        efficiencyTab={<EfficiencyManager players={players} />}
        cardsTab={<CardsManager matches={finishedKO} />}
        penaltiesTab={<PenaltyManager matches={shootoutMatches} />}
      />
    </main>
  );
}
