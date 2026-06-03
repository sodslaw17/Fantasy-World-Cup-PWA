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
    { label: "Rank",       value: `${me.rank} / ${totalPlayers}` },
    { label: "Points",     value: String(me.points)              },
    { label: "Behind",     value: pointsBehind === 0 ? "—" : `-${pointsBehind}` },
  ];

  return (
    <div className="mx-4 mb-4 rounded-xl bg-gold/10 border border-gold/30 px-4 py-3">
      <p className="text-xs text-gold/70 uppercase tracking-wide mb-2 font-medium">My stats</p>
      <div className="flex gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex-1 text-center">
            <p className="text-xl font-bold text-gold tabular-nums">{value}</p>
            <p className="text-xs text-paper/50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
