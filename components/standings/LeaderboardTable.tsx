import { Card, Pill, UserName } from "@/components/wc-ui";
import type { LeaderboardEntry } from "@/lib/scoring/leaderboard";

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
      <p className="text-center text-sm text-ink-3 py-12">
        No players have logged in yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {finishedMatches === 0 && (
        <p className="text-xs text-ink-3 text-center pb-1">
          All players at 0 pts — scoring starts when matches are played
        </p>
      )}

      {entries.map((entry) => {
        const isMe = entry.authId === currentAuthId;

        return (
          <Card
            key={entry.profileId}
            tone={isMe ? "gold" : undefined}
            className="px-4 py-3 flex items-center gap-3"
          >
            {/* Rank */}
            <div className="w-7 text-center shrink-0">
              <span className={`font-num font-bold text-[15px] tabular-nums ${
                entry.rank <= 3 ? "text-gold-ink" : "text-ink-3"
              }`}>
                {entry.rank}
              </span>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <UserName
                name={entry.displayName}
                color={isMe ? "var(--brand)" : "var(--ink-3)"}
                you={isMe}
                size={26}
              />
              <p className="text-xs text-ink-3 mt-0.5">
                {entry.predictionCount}/{totalMatches} predicted
              </p>
            </div>

            {/* Points */}
            <div className="text-right shrink-0">
              <p className="font-num font-bold text-lg tabular-nums text-ink">
                {entry.points}
                <span className="text-xs font-normal text-ink-3 ml-0.5">pts</span>
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
