import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { computeOverallLeaderboard } from "@/lib/scoring/overall";
import { computeEfficiencyLeaderboard, computeDisciplineLeaderboard } from "@/lib/scoring/sidepots";
import { PayoutsSummary } from "@/components/payouts/PayoutsSummary";
import type { Match } from "@/lib/db";
import type { KnockoutMatch } from "@/lib/scoring/knockout";

export const metadata = { title: "Payouts — WC26 Pool" };

export default async function PayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const [
    { data: profiles },
    { data: allMatches },
    { data: predictions },
    { data: effPicks },
    { data: drafts },
    { data: matchStats },
    { data: penaltyEvents },
  ] = await Promise.all([
    service.from("profiles").select("id, display_name, auth_id"),
    service.from("matches").select("*"),
    service.from("predictions").select("user_id, match_id, home_goals_pred, away_goals_pred"),
    service.from("efficiency_picks").select("*, profiles(display_name)"),
    service.from("drafts").select("profile_id, team_id, teams(fifa_code)"),
    service.from("match_stats").select("*"),
    service.from("penalty_events").select("match_id, team_code, type"),
  ]);

  const groupMatches = ((allMatches ?? []) as Match[]).filter((m) => m.stage === "group");
  const koMatches = ((allMatches ?? []) as Match[]).filter((m) => m.stage !== "group");

  const draftRows = (drafts ?? []).map((d: { profile_id: string; teams: { fifa_code: string } | { fifa_code: string }[] | null }) => ({
    profile_id: d.profile_id,
    team_code: (Array.isArray(d.teams) ? d.teams[0]?.fifa_code : d.teams?.fifa_code) ?? "",
  }));

  // Overall leaderboard
  const overallBoard = computeOverallLeaderboard(
    profiles ?? [],
    groupMatches,
    predictions ?? [],
    draftRows,
    koMatches.map((m: Match) => ({
      ...m,
      home_goals: m.home_goals ?? 0,
      away_goals: m.away_goals ?? 0,
    })) as KnockoutMatch[],
    penaltyEvents ?? []
  );

  // Efficiency leaderboard
  const efficiencyBoard = computeEfficiencyLeaderboard(
    (effPicks ?? []).map((p) => {
      const prof = profiles?.find((pr) => pr.id === p.profile_id);
      return {
        profileId: p.profile_id,
        displayName: prof?.display_name ?? "Unknown",
        playerName: p.player_name,
        teamCode: p.team_code,
        goals: p.goals,
        assists: p.assists,
        minutes: p.minutes,
      };
    })
  );

  // Discipline leaderboard
  const disciplineBoard = computeDisciplineLeaderboard(
    profiles ?? [],
    draftRows.map((d) => ({ profile_id: d.profile_id, team_code: d.team_code })),
    matchStats ?? []
  );

  // Tournament is complete when the final match is finished
  const finalMatch = koMatches.find((m: Match) => m.stage === "final");
  const tournamentComplete = finalMatch?.status === "finished";

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold text-gold">Payouts</h1>
        <p className="text-xs text-paper/50">$300 total pool · $30 buy-in × 10 players</p>
      </header>
      <div className="px-4">
        <PayoutsSummary
          overall={overallBoard}
          efficiency={efficiencyBoard}
          discipline={disciplineBoard}
          tournamentComplete={tournamentComplete}
        />
      </div>
    </div>
  );
}
