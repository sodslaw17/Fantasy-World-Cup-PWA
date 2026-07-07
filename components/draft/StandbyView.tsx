import { Avatar } from "@/components/ui/Avatar";
import { SNAKE_PICKS } from "@/lib/draft";
import type { LeaderboardEntry } from "@/lib/scoring/leaderboard";
import { ScreenHeader, Scroll, Card, Banner, Pill } from "@/components/wc-ui";
import Link from "next/link";

interface DraftedTeam {
  teamName: string;
  fifaCode: string;
}

interface StandbyEntry extends LeaderboardEntry {
  avatarUrl?: { avatar_url: string | null } | undefined;
}

interface MyPref {
  preferred_position: number | null;
  position_preferences: number[] | null;
  team_wishlist: string[] | null;
  notes: string | null;
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
  myPref = null,
}: {
  text: string;
  myTeams: DraftedTeam[];
  draftLocked: boolean;
  isAdmin?: boolean;
  leaderboard?: StandbyEntry[];
  teamNameMap?: Record<string, string>;
  totalMatches?: number;
  finishedMatches?: number;
  myPref?: MyPref | null;
}) {
  const positionOrder: number[] = myPref?.position_preferences?.length
    ? myPref.position_preferences
    : myPref?.preferred_position
    ? [myPref.preferred_position]
    : [];

  const teamOrder: string[] = myPref?.team_wishlist ?? [];

  return (
    <>
      <ScreenHeader
        title="Draft Standby"
        sub="Pre-draft · get ready"
        right={isAdmin ? (
          <Link href="/admin">
            <Pill color="ink">Admin</Pill>
          </Link>
        ) : undefined}
      />
      <Scroll>
        {/* Organiser message */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-brand-ink">
            <span className="text-2xl">📋</span>
            <span className="text-sm font-semibold uppercase tracking-wide">
              Message from the organiser
            </span>
          </div>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{text}</p>
        </Card>

        <Banner tone="brand" icon="📲">Watch your phone — the snake draft runs over SMS.</Banner>

        {/* My drafted teams (once locked) */}
        {draftLocked && myTeams.length > 0 && (
          <Card tone="gold" className="p-4 space-y-3">
            <p className="text-[11px] font-bold tracking-[.05em] uppercase text-gold-ink">
              Your drafted teams
            </p>
            <div className="space-y-2">
              {myTeams.map((t) => (
                <div key={t.fifaCode} className="flex items-center gap-3 rounded-lg bg-paper-2 px-3 py-2">
                  <span className="text-xs font-mono text-ink-3 w-8">{t.fifaCode}</span>
                  <span className="text-sm font-semibold text-ink">{t.teamName}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!draftLocked && (
          <p className="text-xs text-ink-3 text-center">
            Draft picks will appear here once the organiser locks them in.
          </p>
        )}

        {/* My draft preferences */}
        {myPref && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-ink-2">
                Your draft preferences
              </h2>
              <Link href="/my-picks" className="text-xs font-semibold text-brand-ink">
                Edit →
              </Link>
            </div>

            {/* Position order */}
            <Card className="p-4 space-y-2">
              <p className="text-[11px] font-bold tracking-[.05em] uppercase text-ink-3">
                Draft position order
              </p>
              {positionOrder.length > 0 ? (
                <ol className="space-y-1.5">
                  {positionOrder.map((pos, i) => (
                    <li key={pos} className="flex items-baseline gap-2">
                      <span className="font-num text-xs text-ink-3 tabular-nums w-4 shrink-0">{i + 1}.</span>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-ink">Position {pos}</span>
                        {SNAKE_PICKS[pos] && (
                          <span className="text-xs text-ink-3 ml-1.5">picks {SNAKE_PICKS[pos].join(", ")}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-ink-3 italic">No position preference set.</p>
              )}
            </Card>

            {/* Team order */}
            <Card className="p-4 space-y-2">
              <p className="text-[11px] font-bold tracking-[.05em] uppercase text-ink-3">
                Team wishlist order
              </p>
              {teamOrder.length > 0 ? (
                <ol className="space-y-1">
                  {teamOrder.map((code, i) => (
                    <li key={code} className="flex items-center gap-2">
                      <span className="font-num text-xs text-ink-3 tabular-nums w-4 shrink-0">{i + 1}.</span>
                      <span className="text-xs font-mono text-ink-3 w-7 shrink-0">{code}</span>
                      <span className="text-sm font-medium text-ink truncate">{teamNameMap[code] ?? code}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-ink-3 italic">No team wishlist set.</p>
              )}
            </Card>
          </div>
        )}

        {!myPref && (
          <Link href="/my-picks">
            <Card className="px-4 py-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Set your draft preferences</p>
              <span className="text-ink-3 text-sm">→</span>
            </Card>
          </Link>
        )}

        {/* Group stage final standings */}
        {leaderboard.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-ink-2">
                Final group standings
              </h2>
              <span className="text-xs text-ink-3">
                {finishedMatches}/{totalMatches} played
              </span>
            </div>
            {leaderboard.map((e) => (
              <Card key={e.profileId} className="px-4 py-3 flex items-center gap-3">
                <span className="w-5 text-sm font-bold text-ink-3 tabular-nums shrink-0">
                  {e.rank}
                </span>
                <Avatar
                  name={e.displayName}
                  url={e.avatarUrl?.avatar_url ?? null}
                  size="sm"
                />
                <span className="flex-1 text-sm font-semibold truncate text-ink">{e.displayName}</span>
                <span className="font-num text-sm font-bold tabular-nums text-ink">
                  {e.points}
                  <span className="text-xs font-normal text-ink-3 ml-0.5">pts</span>
                </span>
              </Card>
            ))}
          </div>
        )}
      </Scroll>
    </>
  );
}
