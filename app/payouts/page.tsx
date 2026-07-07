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

  // Efficiency leaderboard — map over ALL profiles so users without a pick still appear
  const efficiencyBoard = computeEfficiencyLeaderboard(
    (profiles ?? []).map((prof) => {
      const pick = (effPicks ?? []).find((p) => p.profile_id === prof.id);
      return {
        profileId: prof.id,
        displayName: prof.display_name ?? "Unknown",
        playerName: pick?.player_name ?? "",
        teamCode: pick?.team_code ?? null,
        goals: pick?.goals ?? 0,
        assists: pick?.assists ?? 0,
        minutes: pick?.minutes ?? 0,
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
    <div className="flex flex-col h-dvh">
      <header className="bg-surface pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="px-5 pt-2.5 pb-3">
          <div className="text-ink-2 text-[13px] font-semibold mb-0.5">$300 total pool · $30 buy-in × 10 players</div>
          <h1 className="m-0 font-display font-bold uppercase tracking-[.005em] leading-none text-ink text-[28px]">Payouts</h1>
        </div>
        <div className="h-px bg-line" />
      </header>
      <div className="flex-1 overflow-y-auto px-3.5 py-3 pb-[calc(env(safe-area-inset-bottom)+74px)] flex flex-col gap-3">
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
