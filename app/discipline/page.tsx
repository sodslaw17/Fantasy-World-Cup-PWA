import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { computeCardPoints } from "@/lib/scoring/sidepots";

export const metadata = { title: "Team Discipline — WC26 Pool" };

export default async function DisciplinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const [{ data: teams }, { data: matchStats }] = await Promise.all([
    service.from("teams").select("fifa_code, name, group_letter"),
    service.from("match_stats").select("team_code, yellows, second_yellows, straight_reds"),
  ]);

  // Aggregate card points per team
  const teamTotals: Record<string, { yellows: number; secondYellows: number; straightReds: number }> = {};
  for (const ms of matchStats ?? []) {
    const existing = teamTotals[ms.team_code] ?? { yellows: 0, secondYellows: 0, straightReds: 0 };
    teamTotals[ms.team_code] = {
      yellows: existing.yellows + ms.yellows,
      secondYellows: existing.secondYellows + ms.second_yellows,
      straightReds: existing.straightReds + ms.straight_reds,
    };
  }

  const rows = (teams ?? [])
    .map((t) => {
      const stats = teamTotals[t.fifa_code] ?? { yellows: 0, secondYellows: 0, straightReds: 0 };
      return {
        fifaCode: t.fifa_code,
        name: t.name,
        groupLetter: t.group_letter,
        ...stats,
        total: computeCardPoints(stats.yellows, stats.secondYellows, stats.straightReds),
      };
    })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen pb-28">
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold text-gold">Team Discipline</h1>
        <p className="text-xs text-paper/50">Total card points — all tournament matches</p>
      </header>
      <div className="px-4">
        {rows.length === 0 ? (
          <p className="text-sm text-paper/40 text-center py-12">
            No card data entered yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {rows.map((t, i) => (
              <div key={t.fifaCode}
                className="flex items-center gap-3 rounded-xl bg-ink-soft border border-paper/10 px-4 py-3">
                <span className="text-xs text-paper/40 w-5 tabular-nums shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-paper/40">
                    {t.groupLetter ? `Group ${t.groupLetter}` : "Knockout"}
                    {" · "}
                    {t.yellows > 0 && `🟨×${t.yellows} `}
                    {t.secondYellows > 0 && `🟨🟨×${t.secondYellows} `}
                    {t.straightReds > 0 && `🟥×${t.straightReds}`}
                  </p>
                </div>
                <span className="text-lg font-black text-accent-red tabular-nums shrink-0">
                  {t.total}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-paper/30 text-center mt-4">
          1st yellow = 1 pt · 2nd yellow = 2 pts · straight red = 4 pts
        </p>
      </div>
    </div>
  );
}
