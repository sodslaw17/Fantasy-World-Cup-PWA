import { computeCardPoints } from "@/lib/scoring/sidepots";

interface TeamCardRow {
  fifaCode: string;
  name: string;
  yellows: number;
  secondYellows: number;
  straightReds: number;
}

export function TeamDisciplineView({ teams }: { teams: TeamCardRow[] }) {
  const sorted = [...teams]
    .map((t) => ({ ...t, total: computeCardPoints(t.yellows, t.secondYellows, t.straightReds) }))
    .sort((a, b) => b.total - a.total)
    .filter((t) => t.total > 0 || teams.length <= 32);

  if (sorted.length === 0) {
    return <p className="text-sm text-paper/40 text-center py-6">No card data entered yet.</p>;
  }

  return (
    <div className="space-y-1">
      {sorted.map((t, i) => (
        <div key={t.fifaCode}
          className="flex items-center gap-3 rounded-lg px-3 py-2 bg-ink-soft border border-paper/10">
          <span className="text-xs text-paper/40 w-5 tabular-nums shrink-0">{i + 1}</span>
          <span className="text-xs font-mono text-paper/50 w-8 shrink-0">{t.fifaCode}</span>
          <span className="flex-1 text-sm font-medium truncate">{t.name}</span>
          <div className="flex gap-2 text-xs text-paper/50 shrink-0">
            {t.yellows > 0 && <span>🟨{t.yellows}</span>}
            {t.secondYellows > 0 && <span>🟨🟨{t.secondYellows}</span>}
            {t.straightReds > 0 && <span>🟥{t.straightReds}</span>}
          </div>
          <span className="text-sm font-bold text-accent-red tabular-nums shrink-0 w-8 text-right">
            {t.total}
          </span>
        </div>
      ))}
    </div>
  );
}
