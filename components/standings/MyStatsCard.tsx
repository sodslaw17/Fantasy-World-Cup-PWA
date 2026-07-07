import { Card } from "@/components/wc-ui";
import type { LeaderboardEntry } from "@/lib/scoring/leaderboard";

export function MyStatsCard({
  me,
  leader,
  totalPlayers,
}: {
  me: LeaderboardEntry | undefined;
  leader: LeaderboardEntry | undefined;
  totalPlayers: number;
}) {
  if (!me) return null;

  const pointsBehind = leader && leader.authId !== me.authId
    ? leader.points - me.points
    : 0;

  const stats = [
    { label: "Rank",   value: `${me.rank} / ${totalPlayers}` },
    { label: "Points", value: String(me.points) },
    { label: "Behind", value: pointsBehind === 0 ? "—" : `-${pointsBehind}` },
  ];

  return (
    <Card tone="gold" className="mx-4 mb-4 px-4 py-3">
      <p className="text-[11px] text-gold-ink uppercase tracking-[.06em] font-bold mb-2">My stats</p>
      <div className="flex gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex-1 text-center">
            <p className="font-num font-bold text-xl text-gold-ink tabular-nums">{value}</p>
            <p className="text-xs text-ink-3 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
