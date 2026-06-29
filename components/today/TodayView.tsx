"use client";
import { Card } from "@/components/wc-ui";
import { Avatar } from "@/components/ui/Avatar";
import type { Match } from "@/lib/db";

export interface UserPrediction {
  displayName: string;
  authId: string;
  avatarUrl: string | null;
  homeGoalsPred: number | null;
  awayGoalsPred: number | null;
}

export interface DrafterInfo {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface TodayMatch extends Match {
  homeTeamName: string;
  awayTeamName: string;
  myPrediction: { home: number; away: number } | null;
  otherPredictions: UserPrediction[];
}

const STAGE_LABEL: Record<string, string> = {
  group:  "",
  r32:    "Round of 32",
  r16:    "Round of 16",
  qf:     "Quarter-Finals",
  sf:     "Semi-Finals",
  final:  "Finals",
  bronze: "3rd Place Game",
};

function stageLabel(match: TodayMatch): string {
  if (match.stage === "group") return `Group ${match.group_letter ?? ""}`;
  return STAGE_LABEL[match.stage] ?? match.stage;
}

export function TodayView({
  matches,
  draftsByTeam = {},
  isAdmin = false,
}: {
  matches: TodayMatch[];
  draftsByTeam?: Record<string, DrafterInfo>;
  isAdmin?: boolean;
}) {
  if (matches.length === 0) {
    return (
      <Card className="py-14 px-4 flex flex-col items-center text-center gap-3">
        <span className="text-[40px]">📅</span>
        <p className="text-ink-2 text-sm">No matches today.</p>
        <p className="text-ink-3 text-xs">Check back on match days for the latest games.</p>
      </Card>
    );
  }

  return (
    <>
      {matches.map((match) => (
        <MatchBlock
          key={match.id}
          match={match}
          draftsByTeam={draftsByTeam}
          isAdmin={isAdmin}
        />
      ))}
    </>
  );
}

function MatchBlock({
  match,
  draftsByTeam,
  isAdmin: _isAdmin,
}: {
  match: TodayMatch;
  draftsByTeam: Record<string, DrafterInfo>;
  isAdmin: boolean;
}) {
  const kickoff = new Date(match.kickoff_utc);
  const timeStr = kickoff.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const finished = match.status === "finished";
  const live = match.status === "live";
  const isKnockout = match.stage !== "group";

  const homeDrafter = (isKnockout && match.home_team_code)
    ? (draftsByTeam[match.home_team_code] ?? null)
    : null;
  const awayDrafter = (isKnockout && match.away_team_code)
    ? (draftsByTeam[match.away_team_code] ?? null)
    : null;

  return (
    <Card className="overflow-hidden p-0 shrink-0">
      {/* Header + score */}
      <div className="px-4 py-3 bg-paper-2 border-b border-line">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold">
            {live ? (
              <span className="text-red-ink font-bold">● LIVE</span>
            ) : finished ? (
              <span className="text-ink-3">Full time</span>
            ) : (
              <span className="text-ink-2">{timeStr}</span>
            )}
          </span>
          <span className="text-[11px] font-semibold text-ink-3">
            {stageLabel(match)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex-1 text-right text-sm font-semibold truncate text-ink">
            {match.homeTeamName}
          </span>
          <div className="shrink-0 text-center min-w-[72px]">
            {finished || live ? (
              <span className="font-num font-black text-xl tabular-nums text-ink">
                {match.home_goals ?? "–"} – {match.away_goals ?? "–"}
              </span>
            ) : (
              <span className="text-sm text-ink-3 font-medium">vs</span>
            )}
          </div>
          <span className="flex-1 text-left text-sm font-semibold truncate text-ink">
            {match.awayTeamName}
          </span>
        </div>
      </div>

      {/* Pool stakes — only rendered when at least one team has a drafter */}
      <PoolStakes
        homeDrafter={homeDrafter}
        awayDrafter={awayDrafter}
        homeTeamName={match.homeTeamName}
        awayTeamName={match.awayTeamName}
      />
    </Card>
  );
}

function PoolStakes({
  homeDrafter,
  awayDrafter,
  homeTeamName,
  awayTeamName,
}: {
  homeDrafter: DrafterInfo | null;
  awayDrafter: DrafterInfo | null;
  homeTeamName: string;
  awayTeamName: string;
}) {
  if (!homeDrafter && !awayDrafter) return null;

  const isDuel =
    !!homeDrafter &&
    !!awayDrafter &&
    homeDrafter.profileId !== awayDrafter.profileId;

  if (isDuel) {
    // Two different users have skin in this game — frame as a head-to-head duel.
    return (
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Home drafter, right-aligned to mirror score row */}
          <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
            <span className="text-[12px] text-ink font-semibold truncate">
              {homeDrafter.displayName}
            </span>
            <Avatar name={homeDrafter.displayName} url={homeDrafter.avatarUrl} size="xs" />
          </div>

          <div className="shrink-0 min-w-[72px] flex justify-center">
            <span className="text-[11px] font-bold text-brand-ink tracking-wide uppercase">vs</span>
          </div>

          {/* Away drafter, left-aligned */}
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <Avatar name={awayDrafter.displayName} url={awayDrafter.avatarUrl} size="xs" />
            <span className="text-[12px] text-ink font-semibold truncate">
              {awayDrafter.displayName}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // One-sided: only one team is drafted, or same user drafted both sides.
  const items: Array<{ drafter: DrafterInfo; teamName: string }> = [];
  if (homeDrafter) items.push({ drafter: homeDrafter, teamName: homeTeamName });
  if (awayDrafter && awayDrafter.profileId !== homeDrafter?.profileId) {
    items.push({ drafter: awayDrafter, teamName: awayTeamName });
  } else if (awayDrafter && !homeDrafter) {
    items.push({ drafter: awayDrafter, teamName: awayTeamName });
  }
  if (homeDrafter && awayDrafter && homeDrafter.profileId === awayDrafter.profileId) {
    // Same user drafted both — replace both items with a single "has both teams" entry
    return (
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Avatar name={homeDrafter.displayName} url={homeDrafter.avatarUrl} size="xs" />
          <span className="text-[12px] text-ink-2">
            <span className="font-semibold text-ink">{homeDrafter.displayName}</span>
            {" "}has both teams
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5">
      <div className="flex flex-col gap-1.5">
        {items.map(({ drafter, teamName }) => (
          <div key={drafter.profileId + teamName} className="flex items-center gap-1.5">
            <Avatar name={drafter.displayName} url={drafter.avatarUrl} size="xs" />
            <span className="text-[12px] text-ink-2">
              <span className="font-semibold text-ink">{drafter.displayName}</span>
              {" "}&mdash;{" "}{teamName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
