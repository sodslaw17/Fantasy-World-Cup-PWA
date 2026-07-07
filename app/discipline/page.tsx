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
    <div className="flex flex-col h-dvh">
      <header className="bg-surface pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="px-5 pt-2.5 pb-3">
          <div className="text-ink-2 text-[13px] font-semibold mb-0.5">All tournament matches</div>
          <h1 className="m-0 font-display font-bold uppercase tracking-[.005em] leading-none text-ink text-[28px]">Discipline</h1>
        </div>
        <div className="h-px bg-line" />
      </header>
      <div className="flex-1 overflow-y-auto px-3.5 py-3 pb-[calc(env(safe-area-inset-bottom)+74px)] flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-12">No card data entered yet.</p>
        ) : (
          <>
            {rows.map((t, i) => (
              <div key={t.fifaCode}
                className="flex items-center gap-3 rounded-xl bg-surface border border-line px-4 py-3">
                <span className="text-xs text-ink-3 w-5 tabular-nums shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{t.name}</p>
                  <p className="text-xs text-ink-3">
                    {t.groupLetter ? `Group ${t.groupLetter}` : "Knockout"}
                    {" · "}
                    {t.yellows > 0 && `🟨×${t.yellows} `}
                    {t.secondYellows > 0 && `🟨🟨×${t.secondYellows} `}
                    {t.straightReds > 0 && `🟥×${t.straightReds}`}
                  </p>
                </div>
                <span className="font-num text-lg font-black text-red-ink tabular-nums shrink-0">
                  {t.total}
                </span>
              </div>
            ))}
            <p className="text-xs text-ink-3 text-center py-1">
              1st yellow = 1 pt · 2nd yellow = 2 pts · straight red = 4 pts
            </p>
          </>
        )}
      </div>
    </div>
  );
}
