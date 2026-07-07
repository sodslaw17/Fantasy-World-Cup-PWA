import { Card } from "@/components/wc-ui";
import type { DisciplineEntry } from "@/lib/scoring/sidepots";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export interface CountryCardEntry {
  teamCode: string;
  teamName: string;
  cardPoints: number;
  draftedBy: string[];
}

export function DisciplineLeaderboard({
  entries,
  countryBreakdown = [],
}: {
  entries: DisciplineEntry[];
  countryBreakdown?: CountryCardEntry[];
}) {
  if (entries.length === 0) return null;

  const hasAnyPoints = entries.some((e) => e.totalCardPoints > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between pt-2">
        <h2 className="text-xs font-semibold text-ink-2 uppercase tracking-wide">
          2nd Side Pot — Worst Discipline
        </h2>
        <span className="text-xs text-ink-3">$30</span>
      </div>

      <Card tone="muted" className="px-4 py-2">
        <p className="text-xs text-ink-3 text-center py-1">
          Winner = most card points from your 3 drafted teams
          {" · "}
          <span className="font-mono">1Y=1 · 2Y=2 · SR=4</span>
        </p>
      </Card>

      {!hasAnyPoints && (
        <p className="text-xs text-ink-3 text-center py-2 italic">
          No card points yet — updates as knockout matches finish.
        </p>
      )}

      {entries.map((e) => {
        const medal = MEDALS[e.rank];
        return (
          <Card key={e.profileId} className="px-4 py-3 flex items-center gap-3">
            <span className="w-5 text-center shrink-0">
              {medal ? (
                <span className="text-base">{medal}</span>
              ) : (
                <span className="text-xs font-bold text-ink-3">{e.rank}</span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{e.displayName}</p>
              {e.teamCodes.length > 0 && (
                <p className="text-xs text-ink-3 font-mono">{e.teamCodes.join(" · ")}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className={`font-num font-black text-lg tabular-nums ${e.totalCardPoints > 0 ? "text-red-ink" : "text-ink-3"}`}>
                {e.totalCardPoints}
              </p>
              <p className="text-[10px] text-ink-3">card pts</p>
            </div>
          </Card>
        );
      })}

      {countryBreakdown.length > 0 && (
        <>
          <div className="pt-3 pb-1">
            <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wide">
              Card points by country
            </h3>
          </div>
          {countryBreakdown.map((c) => (
            <Card key={c.teamCode} className="px-4 py-3 flex items-center gap-3">
              <span className="font-mono text-xs text-ink-3 w-8 shrink-0">{c.teamCode}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{c.teamName}</p>
                {c.draftedBy.length > 0 ? (
                  <p className="text-xs text-ink-3 truncate">
                    Drafted by: {c.draftedBy.join(", ")}
                  </p>
                ) : (
                  <p className="text-xs text-ink-3 italic">Undrafted</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className={`font-num font-bold text-base tabular-nums ${c.cardPoints > 0 ? "text-red-ink" : "text-ink-3"}`}>
                  {c.cardPoints}
                </p>
                <p className="text-[10px] text-ink-3">card pts</p>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
