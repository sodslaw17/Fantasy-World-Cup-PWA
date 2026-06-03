import type { Match } from "@/lib/db";
import type { OverallEntry } from "@/lib/scoring/overall";

interface KnockoutMatch extends Match {
  homeTeamName: string;
  awayTeamName: string;
  homeIconUrl?: string | null;
  awayIconUrl?: string | null;
}

interface DraftedMatchInfo {
  match: KnockoutMatch;
  myTeams: string[]; // which of my teams are in this match
}

export function KnockoutHome({
  todayMatches,
  myDraftedCodes,
  me,
  leader,
  totalPlayers,
}: {
  todayMatches: KnockoutMatch[];
  myDraftedCodes: string[];
  me: OverallEntry | undefined;
  leader: OverallEntry | undefined;
  totalPlayers: number;
}) {
  const hasTodayMatches = todayMatches.length > 0;

  return (
    <div className="space-y-4">
      {/* My overall stats */}
      {me && (
        <div className="mx-0 rounded-xl bg-gold/10 border border-gold/30 px-4 py-3">
          <p className="text-xs text-gold/70 uppercase tracking-wide mb-2 font-medium">
            Overall standings
          </p>
          <div className="flex gap-4">
            {[
              { label: "Rank",    value: `${me.rank} / ${totalPlayers}` },
              { label: "Total",   value: `${me.totalPoints} pts`        },
              { label: "Behind",  value: leader && leader.authId !== me.authId
                  ? `-${leader.totalPoints - me.totalPoints}`
                  : "—"
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 text-center">
                <p className="text-xl font-bold text-gold tabular-nums">{value}</p>
                <p className="text-xs text-paper/50">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 pt-2 border-t border-gold/20">
            {[
              { label: "Group pts",   value: me.groupPoints   },
              { label: "Knockout pts", value: me.knockoutPoints },
              { label: "GD",          value: me.goalDifference >= 0 ? `+${me.goalDifference}` : String(me.goalDifference) },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 text-center">
                <p className="text-sm font-semibold tabular-nums">{value}</p>
                <p className="text-xs text-paper/40">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's matches */}
      <div>
        <h2 className="text-sm font-semibold text-paper/60 uppercase tracking-wide mb-3">
          {hasTodayMatches ? "Today's matches" : "No matches today"}
        </h2>

        {hasTodayMatches ? (
          <div className="space-y-3">
            {todayMatches.map((match) => {
              const myHomeTeam = myDraftedCodes.includes(match.home_team_code ?? "");
              const myAwayTeam = myDraftedCodes.includes(match.away_team_code ?? "");

              return (
                <div
                  key={match.id}
                  className={`rounded-xl border p-4 ${
                    myHomeTeam || myAwayTeam
                      ? "bg-gold/10 border-gold/30"
                      : "bg-ink-soft border-paper/10"
                  }`}
                >
                  {(myHomeTeam || myAwayTeam) && (
                    <p className="text-xs text-gold font-semibold mb-2">
                      ⚽ Your team is playing
                    </p>
                  )}

                  {/* Stage badge */}
                  <p className="text-xs text-paper/40 mb-2 capitalize">
                    {match.stage.replace("r32", "Round of 32")
                      .replace("r16", "Round of 16")
                      .replace("qf", "Quarter-Final")
                      .replace("sf", "Semi-Final")
                      .replace("bronze", "3rd Place")
                      .replace("final", "Final")}
                  </p>

                  {/* Teams + score */}
                  <div className="flex items-center gap-3">
                    <TeamDisplay
                      name={match.homeTeamName}
                      code={match.home_team_code}
                      iconUrl={match.homeIconUrl}
                      isMyTeam={myHomeTeam}
                    />

                    <div className="shrink-0 text-center min-w-[60px]">
                      {match.status === "finished" ? (
                        <span className="text-xl font-black tabular-nums">
                          {match.home_goals} – {match.away_goals}
                          {match.went_to_shootout && (
                            <span className="block text-xs font-normal text-paper/40">
                              ({match.shootout_winner === "home"
                                ? match.homeTeamName
                                : match.awayTeamName}{" "}
                              on pens)
                            </span>
                          )}
                        </span>
                      ) : match.status === "live" ? (
                        <span className="text-accent-green text-xs font-semibold animate-pulse">
                          LIVE
                        </span>
                      ) : (
                        <span className="text-paper/40 text-sm">
                          {new Date(match.kickoff_utc).toLocaleTimeString(undefined, {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    <TeamDisplay
                      name={match.awayTeamName}
                      code={match.away_team_code}
                      iconUrl={match.awayIconUrl}
                      isMyTeam={myAwayTeam}
                      right
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-paper/40">
            Check back on match days for live results.
          </p>
        )}
      </div>
    </div>
  );
}

function TeamDisplay({
  name,
  code,
  iconUrl,
  isMyTeam,
  right = false,
}: {
  name: string;
  code: string | null;
  iconUrl?: string | null;
  isMyTeam: boolean;
  right?: boolean;
}) {
  return (
    <div className={`flex-1 flex flex-col items-center gap-1 ${right ? "" : ""}`}>
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt={name} className="w-8 h-8 object-contain rounded" />
      ) : (
        <span className="text-xs font-mono text-paper/40 bg-ink rounded px-1.5 py-0.5">
          {code ?? "?"}
        </span>
      )}
      <span
        className={`text-xs font-medium text-center leading-tight ${
          isMyTeam ? "text-gold" : "text-paper"
        }`}
      >
        {name}
      </span>
    </div>
  );
}
