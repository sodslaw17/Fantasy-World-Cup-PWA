import { createServiceClient } from "@/lib/supabase/service";
import { GroupResultsTab, KnockoutResultsTab } from "@/components/admin/results/MatchResultEntry";
import { ResultsTabs } from "@/components/admin/results/ResultsTabs";
import type { Match } from "@/lib/db";

export const metadata = { title: "Results — WC26 Admin" };

export default async function ResultsPage() {
  const service = createServiceClient();

  const [{ data: matches }, { data: teams }] = await Promise.all([
    service.from("matches").select("*").order("kickoff_utc"),
    service.from("teams").select("fifa_code, name"),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

  const allMatches = (matches ?? []) as Match[];
  const groupMatches = allMatches.filter((m) => m.stage === "group");
  const knockoutMatches = allMatches.filter((m) => m.stage !== "group");

  // Group matches by group letter with team names
  const groups: Record<
    string,
    { match: Match; homeTeam: string; awayTeam: string }[]
  > = {};
  for (const m of groupMatches) {
    const letter = m.group_letter ?? "?";
    (groups[letter] ??= []).push({
      match: m,
      homeTeam: teamNames[m.home_team_code ?? ""] ?? m.home_team_code ?? "TBD",
      awayTeam: teamNames[m.away_team_code ?? ""] ?? m.away_team_code ?? "TBD",
    });
  }

  const done = groupMatches.filter((m) => m.status === "finished").length;
  const total = groupMatches.length;

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gold mb-1">Match Results</h1>
      <p className="text-sm text-paper/50 mb-4">
        {done}/{total} group matches entered
      </p>
      <ResultsTabs
        groupTab={<GroupResultsTab groups={groups} />}
        knockoutTab={
          <KnockoutResultsTab
            matches={knockoutMatches}
            teamNames={teamNames}
          />
        }
      />
    </main>
  );
}
