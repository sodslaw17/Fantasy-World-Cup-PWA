import { Avatar } from "@/components/ui/Avatar";
import type { EfficiencyEntry } from "@/lib/scoring/sidepots";

export function EfficiencyLeaderboard({ entries }: { entries: (EfficiencyEntry & { userAvatarUrl: string | null; playerPhotoUrl: string | null })[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-paper/50 uppercase tracking-wide pt-2">
        Efficiency — 1st Side Pot
      </h2>
      {entries.map((e) => (
        <div key={e.profileId}
          className="rounded-xl bg-ink-soft border border-paper/10 px-4 py-3 flex items-center gap-3">
          <span className="w-5 text-xs font-bold text-paper/40 tabular-nums shrink-0">{e.rank}</span>

          {/* User avatar */}
          <Avatar name={e.displayName} url={e.userAvatarUrl} size="sm" />

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-paper truncate">{e.displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {/* Footballer avatar */}
              <Avatar name={e.playerName} url={e.playerPhotoUrl} size="xs" />
              <p className="text-xs text-paper/60 truncate">{e.playerName || <em className="opacity-50">not entered</em>}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-gold tabular-nums">
              {e.minutes > 0 ? e.efficiency.toFixed(4) : "—"}
            </p>
            <p className="text-xs text-paper/40 tabular-nums">
              {e.goals}G {e.assists}A / {e.minutes}m
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
