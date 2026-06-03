import type { LeaderboardEntry } from "@/lib/scoring/leaderboard";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function LeaderboardTable({
  entries,
  currentAuthId,
  totalMatches,
  finishedMatches,
}: {
  entries: LeaderboardEntry[];
  currentAuthId: string | null;
  totalMatches: number;
  finishedMatches: number;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-paper/40 py-12">
        No players have logged in yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {finishedMatches === 0 && (
        <p className="text-xs text-paper/40 text-center pb-1">
          All players at 0 pts — scoring starts when matches are played
        </p>
      )}

      {entries.map((entry) => {
        const isMe = entry.authId === currentAuthId;
        const medal = MEDALS[entry.rank];

        return (
          <div
            key={entry.profileId}
            className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
              isMe
                ? "bg-gold/10 border-gold/30"
                : "bg-ink-soft border-paper/10"
            }`}
          >
            {/* Rank */}
            <div className="w-8 text-center shrink-0">
              {medal ? (
                <span className="text-lg">{medal}</span>
              ) : (
                <span className="text-sm font-bold text-paper/40">{entry.rank}</span>
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${isMe ? "text-gold" : "text-paper"}`}>
                {entry.displayName}
                {isMe && <span className="text-xs font-normal text-gold/70 ml-1">(you)</span>}
              </p>
              <p className="text-xs text-paper/40">
                {entry.predictionCount}/{totalMatches} predicted
              </p>
            </div>

            {/* Points */}
            <div className="text-right shrink-0">
              <p className="text-lg font-bold tabular-nums">
                {entry.points}
                <span className="text-xs font-normal text-paper/40 ml-0.5">pts</span>
              </p>
              {finishedMatches > 0 && (
                <p className="text-xs text-paper/40 tabular-nums">
                  ∑{entry.predictedGoals} pred
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
