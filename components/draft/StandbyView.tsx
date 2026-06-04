import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { SNAKE_PICKS } from "@/lib/draft";
import type { LeaderboardEntry } from "@/lib/scoring/leaderboard";

interface DraftedTeam {
  teamName: string;
  fifaCode: string;
}

interface StandbyEntry extends LeaderboardEntry {
  avatarUrl?: { avatar_url: string | null } | undefined;
  pref: {
    preferred_position: number | null;
    team_wishlist: string[] | null;
    notes: string | null;
  } | null;
}

export function StandbyView({
  text,
  myTeams,
  draftLocked,
  isAdmin,
  leaderboard = [],
  teamNameMap = {},
  totalMatches = 0,
  finishedMatches = 0,
}: {
  text: string;
  myTeams: DraftedTeam[];
  draftLocked: boolean;
  isAdmin?: boolean;
  leaderboard?: StandbyEntry[];
  teamNameMap?: Record<string, string>;
  totalMatches?: number;
  finishedMatches?: number;
}) {
  return (
    <div className="min-h-screen flex flex-col pb-24">
      <header className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <p className="text-xs text-paper/50 uppercase tracking-widest">WC26 Pool</p>
          <h1 className="text-lg font-bold text-gold mt-1">Draft Standby</h1>
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            className="text-xs text-paper/40 hover:text-paper border border-paper/20 rounded-lg px-3 py-1.5"
          >
            Admin
          </Link>
        )}
      </header>

      <div className="px-4 space-y-5">

        {/* Organiser message */}
        <div className="rounded-xl bg-ink-soft border border-paper/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-gold">
            <span className="text-2xl">📋</span>
            <span className="text-sm font-semibold uppercase tracking-wide">
              Message from the organiser
            </span>
          </div>
          <p className="text-sm text-paper/80 leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>

        {/* My drafted teams (once locked) */}
        {draftLocked && myTeams.length > 0 && (
          <div className="rounded-xl bg-gold/10 border border-gold/30 p-4 space-y-3">
            <p className="text-xs text-gold/70 uppercase tracking-wide font-medium">
              Your drafted teams
            </p>
            <div className="space-y-2">
              {myTeams.map((t) => (
                <div key={t.fifaCode} className="flex items-center gap-3 rounded-lg bg-ink px-3 py-2">
                  <span className="text-xs font-mono text-paper/40 w-8">{t.fifaCode}</span>
                  <span className="text-sm font-semibold">{t.teamName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!draftLocked && (
          <p className="text-xs text-paper/30 text-center">
            Draft picks will appear here once the organiser locks them in.
          </p>
        )}

        {/* Group stage final standings */}
        {leaderboard.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-paper/60 uppercase tracking-wide">
                Final group standings
              </h2>
              <span className="text-xs text-paper/40">
                {finishedMatches}/{totalMatches} played
              </span>
            </div>
            {leaderboard.map((e) => (
              <div
                key={e.profileId}
                className="rounded-xl bg-ink-soft border border-paper/10 px-4 py-3 flex items-center gap-3"
              >
                <span className="w-5 text-sm font-bold text-paper/40 tabular-nums shrink-0">
                  {e.rank}
                </span>
                <Avatar
                  name={e.displayName}
                  url={e.avatarUrl?.avatar_url ?? null}
                  size="sm"
                />
                <span className="flex-1 text-sm font-semibold truncate">{e.displayName}</span>
                <span className="text-sm font-bold tabular-nums">
                  {e.points}
                  <span className="text-xs font-normal text-paper/40 ml-0.5">pts</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Draft preferences — all users */}
        {leaderboard.some((e) => e.pref) && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-paper/60 uppercase tracking-wide">
              Draft preferences
            </h2>
            <p className="text-xs text-paper/40">
              Players are listed by group stage rank. Position preference and team wishlist are shown for planning.
            </p>
            {leaderboard.map((e) => (
              <div
                key={e.profileId}
                className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={e.displayName} url={e.avatarUrl?.avatar_url ?? null} size="sm" />
                  <span className="text-sm font-semibold">{e.displayName}</span>
                  <span className="text-xs text-paper/40 ml-auto">#{e.rank} seed</span>
                </div>

                {e.pref ? (
                  <div className="space-y-1.5 pl-9">
                    {e.pref.preferred_position && (
                      <p className="text-xs text-paper/70">
                        <span className="text-paper/40">Preferred position: </span>
                        <span className="font-semibold text-gold">
                          #{e.pref.preferred_position}
                        </span>
                        <span className="text-paper/40 ml-1">
                          — picks{" "}
                          <span className="font-mono text-paper/60">
                            {SNAKE_PICKS[e.pref.preferred_position]?.join(", ")}
                          </span>
                        </span>
                      </p>
                    )}
                    {e.pref.team_wishlist && e.pref.team_wishlist.length > 0 && (
                      <div>
                        <p className="text-xs text-paper/40 mb-1">Team wishlist</p>
                        <div className="flex flex-wrap gap-1.5">
                          {e.pref.team_wishlist.slice(0, 5).map((code, i) => (
                            <span
                              key={code}
                              className="text-xs bg-ink rounded px-2 py-0.5 border border-paper/10"
                            >
                              <span className="text-paper/40">{i + 1}.</span>{" "}
                              <span className="font-medium">
                                {teamNameMap[code] ?? code}
                              </span>
                            </span>
                          ))}
                          {e.pref.team_wishlist.length > 5 && (
                            <span className="text-xs text-paper/30">
                              +{e.pref.team_wishlist.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {e.pref.notes && (
                      <p className="text-xs text-paper/50 italic">"{e.pref.notes}"</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-paper/30 pl-9 italic">No preferences submitted</p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
