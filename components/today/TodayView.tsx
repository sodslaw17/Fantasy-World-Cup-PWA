import type { Match } from "@/lib/db";

export interface UserPrediction {
  displayName: string;
  authId: string;
  homeGoalsPred: number;
  awayGoalsPred: number;
}

export interface TodayMatch extends Match {
  homeTeamName: string;
  awayTeamName: string;
  myPrediction: { home: number; away: number } | null;
  otherPredictions: UserPrediction[];
}

export function TodayView({
  matches,
  deadlinePassed,
}: {
  matches: TodayMatch[];
  deadlinePassed: boolean;
}) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-3">
        <span className="text-4xl">📅</span>
        <p className="text-paper/60 text-sm">No matches today.</p>
        <p className="text-paper/30 text-xs">Check back on June 11 for the opening games.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <MatchBlock
          key={match.id}
          match={match}
          deadlinePassed={deadlinePassed}
        />
      ))}
    </div>
  );
}

function MatchBlock({
  match,
  deadlinePassed,
}: {
  match: TodayMatch;
  deadlinePassed: boolean;
}) {
  const kickoff = new Date(match.kickoff_utc);
  const timeStr = kickoff.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const finished = match.status === "finished";
  const live = match.status === "live";

  return (
    <div className="rounded-xl bg-ink-soft border border-paper/10 overflow-hidden">
      {/* Match header */}
      <div className="px-4 py-3 border-b border-paper/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-paper/50">
            {live ? (
              <span className="text-accent-green font-semibold animate-pulse">● LIVE</span>
            ) : finished ? (
              <span className="text-paper/40">Full time</span>
            ) : (
              timeStr
            )}
          </span>
          <span className="text-xs text-paper/40">
            Group {match.group_letter}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex-1 text-right text-sm font-semibold truncate">
            {match.homeTeamName}
          </span>

          <div className="shrink-0 text-center min-w-[72px]">
            {finished || live ? (
              <span className="text-xl font-black tabular-nums">
                {match.home_goals ?? "–"} – {match.away_goals ?? "–"}
              </span>
            ) : (
              <span className="text-sm text-paper/40 font-medium">vs</span>
            )}
          </div>

          <span className="flex-1 text-left text-sm font-semibold truncate">
            {match.awayTeamName}
          </span>
        </div>
      </div>

      {/* Predictions */}
      <div className="px-4 py-2 space-y-0.5">
        {!deadlinePassed && !finished && !live && (
          <p className="text-xs text-paper/30 py-1 italic">
            Predictions revealed after the deadline
          </p>
        )}

        {(deadlinePassed || finished || live) && (
          <>
            {/* My prediction first */}
            {match.myPrediction && (
              <PredRow
                name="You"
                home={match.myPrediction.home}
                away={match.myPrediction.away}
                result={finished ? { home: match.home_goals!, away: match.away_goals! } : null}
                isMe
              />
            )}
            {!match.myPrediction && (
              <p className="text-xs text-paper/30 py-1 italic">You didn&apos;t predict this match</p>
            )}

            {/* Others */}
            {match.otherPredictions.map((p) => (
              <PredRow
                key={p.authId}
                name={p.displayName}
                home={p.homeGoalsPred}
                away={p.awayGoalsPred}
                result={finished ? { home: match.home_goals!, away: match.away_goals! } : null}
                isMe={false}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function score(pred: { home: number; away: number }, result: { home: number; away: number }): number {
  const exact = pred.home === result.home && pred.away === result.away;
  if (exact) return 3;
  const predOut = pred.home > pred.away ? "H" : pred.away > pred.home ? "A" : "D";
  const realOut = result.home > result.away ? "H" : result.away > result.home ? "A" : "D";
  return predOut === realOut ? 2 : 0;
}

function PredRow({
  name,
  home,
  away,
  result,
  isMe,
}: {
  name: string;
  home: number;
  away: number;
  result: { home: number; away: number } | null;
  isMe: boolean;
}) {
  const pts = result ? score({ home, away }, result) : null;

  return (
    <div
      className={`flex items-center gap-2 py-1.5 rounded px-1 ${
        isMe ? "bg-gold/5" : ""
      }`}
    >
      <span
        className={`text-xs w-20 truncate shrink-0 ${
          isMe ? "text-gold font-semibold" : "text-paper/60"
        }`}
      >
        {name}
      </span>
      <span className={`text-sm font-bold tabular-nums ${isMe ? "text-gold" : "text-paper"}`}>
        {home} – {away}
      </span>
      {pts !== null && (
        <span
          className={`ml-auto text-xs font-semibold tabular-nums ${
            pts === 3
              ? "text-accent-green"
              : pts === 2
              ? "text-gold"
              : "text-paper/30"
          }`}
        >
          {pts === 3 ? "+3" : pts === 2 ? "+2" : "+0"}
        </span>
      )}
    </div>
  );
}
