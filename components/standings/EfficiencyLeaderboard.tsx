import { Avatar } from "@/components/ui/Avatar";
import type { EfficiencyEntry } from "@/lib/scoring/sidepots";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function EfficiencyLeaderboard({
  entries,
}: {
  entries: (EfficiencyEntry & { userAvatarUrl: string | null; playerPhotoUrl: string | null })[];
}) {
  if (entries.length === 0) return null;

  const hasAnyData = entries.some((e) => e.minutes > 0);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-baseline justify-between pt-2">
        <h2 className="text-xs font-semibold text-paper/50 uppercase tracking-wide">
          1st Side Pot — Most Efficient Footballer
        </h2>
        <span className="text-xs text-paper/30">$30</span>
      </div>

      <div className="rounded-xl bg-ink-soft border border-paper/10 px-4 py-2">
        <p className="text-xs text-paper/40 text-center py-1">
          Winner = highest{" "}
          <span className="font-mono text-paper/60">(goals + assists) ÷ minutes played</span>
        </p>
      </div>

      {!hasAnyData && (
        <p className="text-xs text-paper/30 text-center py-2 italic">
          Stats not yet entered — admin updates after the tournament.
        </p>
      )}

      {entries.map((e) => {
        const medal = MEDALS[e.rank];
        const hasStats = e.minutes > 0;

        return (
          <div
            key={e.profileId}
            className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-3"
          >
            {/* User row */}
            <div className="flex items-center gap-3">
              <span className="w-5 text-center shrink-0">
                {medal ? (
                  <span className="text-base">{medal}</span>
                ) : (
                  <span className="text-xs font-bold text-paper/40">{e.rank}</span>
                )}
              </span>
              <Avatar name={e.displayName} url={e.userAvatarUrl} size="sm" />
              <span className="flex-1 text-sm font-semibold truncate">{e.displayName}</span>

              {/* Efficiency score — prominent */}
              <div className="text-right shrink-0">
                <p className={`text-lg font-black tabular-nums ${hasStats ? "text-gold" : "text-paper/20"}`}>
                  {hasStats ? e.efficiency.toFixed(4) : "—"}
                </p>
                <p className="text-xs text-paper/40">(G+A)/min</p>
              </div>
            </div>

            {/* Footballer row */}
            <div className="flex items-center gap-2 pl-8 border-t border-paper/10 pt-2">
              <Avatar name={e.playerName || "?"} url={e.playerPhotoUrl} size="xs" />
              <span className="flex-1 text-xs text-paper/70 truncate">
                {e.playerName || <em className="text-paper/30">footballer not entered</em>}
                {e.teamCode && (
                  <span className="ml-1 font-mono text-paper/40">({e.teamCode})</span>
                )}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 pl-8">
              {[
                { label: "Goals",   value: e.goals,   icon: "⚽" },
                { label: "Assists", value: e.assists,  icon: "🎯" },
                { label: "Minutes", value: e.minutes,  icon: "⏱" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex-1 text-center rounded-lg bg-ink px-2 py-1.5">
                  <p className={`text-base font-bold tabular-nums ${hasStats ? "text-paper" : "text-paper/20"}`}>
                    {value}
                  </p>
                  <p className="text-xs text-paper/40">{icon} {label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
