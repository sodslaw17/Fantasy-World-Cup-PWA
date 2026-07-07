import { createServiceClient } from "@/lib/supabase/service";
import { GroupResultsTab, KnockoutResultsTab } from "@/components/admin/results/MatchResultEntry";
import { ResultsTabs } from "@/components/admin/results/ResultsTabs";
import { AdminPageHeader } from "../_components/AdminShell";
import type { Match } from "@/lib/db";

export const metadata = { title: "Match & Stats — WC26 Admin" };

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
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader
        title="Match & Stats"
        sub={`${done} / ${total} group matches entered`}
      />
      <div className="px-4 pb-8">
        <ResultsTabs
          groupTab={<GroupResultsTab groups={groups} />}
          knockoutTab={
            <KnockoutResultsTab
              matches={knockoutMatches}
              teamNames={teamNames}
            />
          }
        />
      </div>
    </div>
  );
}
