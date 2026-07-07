import type { Match } from "@/lib/db";
import type { OverallEntry } from "@/lib/scoring/overall";
import { Card } from "@/components/wc-ui";

interface KnockoutMatch extends Match {
  homeTeamName: string;
  awayTeamName: string;
  homeIconUrl?: string | null;
  awayIconUrl?: string | null;
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
        <Card tone="gold" className="px-4 py-3">
          <p className="text-[11px] font-bold tracking-[.05em] uppercase text-gold-ink mb-2">
            Overall standings
          </p>
          <div className="flex gap-4">
            {[
              { label: "Rank",   value: `${me.rank} / ${totalPlayers}` },
              { label: "Total",  value: `${me.totalPoints} pts` },
              { label: "Behind", value: leader && leader.authId !== me.authId
                  ? `-${leader.totalPoints - me.totalPoints}`
                  : "—"
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 text-center">
                <p className="font-num text-xl font-bold text-gold-ink tabular-nums">{value}</p>
                <p className="text-xs text-ink-2">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 pt-2 border-t border-gold-line">
            {[
              { label: "Group pts",    value: String(me.groupPoints)    },
              { label: "Knockout pts", value: String(me.knockoutPoints) },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 text-center">
                <p className="font-num text-sm font-semibold tabular-nums text-ink">{value}</p>
                <p className="text-xs text-ink-3">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Today's matches */}
      <div>
        <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mb-3">
          {hasTodayMatches ? "Today's matches" : "No matches today"}
        </h2>

        {hasTodayMatches ? (
          <div className="space-y-3">
            {todayMatches.map((match) => {
              const myHomeTeam = myDraftedCodes.includes(match.home_team_code ?? "");
              const myAwayTeam = myDraftedCodes.includes(match.away_team_code ?? "");
              const youIn = myHomeTeam || myAwayTeam;

              return (
                <Card key={match.id} className="p-4" style={youIn ? { borderColor: "var(--brand)" } : undefined}>
                  {youIn && (
                    <p className="text-xs text-brand-ink font-semibold mb-2">
                      ⚽ Your team is playing
                    </p>
                  )}

                  <p className="text-xs text-ink-3 mb-2 capitalize">
                    {match.stage
                      .replace("r32", "Round of 32")
                      .replace("r16", "Round of 16")
                      .replace("qf", "Quarter-Final")
                      .replace("sf", "Semi-Final")
                      .replace("bronze", "3rd Place")
                      .replace("final", "Final")}
                  </p>

                  <div className="flex items-center gap-3">
                    <TeamDisplay
                      name={match.homeTeamName}
                      code={match.home_team_code}
                      iconUrl={match.homeIconUrl}
                      isMyTeam={myHomeTeam}
                    />

                    <div className="shrink-0 text-center min-w-[60px]">
                      {match.status === "finished" ? (
                        <span className="font-num text-xl font-black tabular-nums text-ink">
                          {match.home_goals} – {match.away_goals}
                          {match.went_to_shootout && (
                            <span className="block text-xs font-normal text-ink-3">
                              ({match.shootout_winner === "home"
                                ? match.homeTeamName
                                : match.awayTeamName}{" "}
                              on pens)
                            </span>
                          )}
                        </span>
                      ) : match.status === "live" ? (
                        <span className="text-red-ink text-xs font-bold">LIVE</span>
                      ) : (
                        <span className="text-ink-3 text-sm">
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
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-3">Check back on match days for live results.</p>
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
  void right;
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt={name} className="w-8 h-8 object-contain rounded" />
      ) : (
        <span className="text-xs font-mono text-ink-3 bg-paper-2 rounded px-1.5 py-0.5">
          {code ?? "?"}
        </span>
      )}
      <span
        className={`text-xs font-medium text-center leading-tight ${
          isMyTeam ? "text-brand-ink" : "text-ink"
        }`}
      >
        {name}
      </span>
    </div>
  );
}
