import { Avatar } from "@/components/ui/Avatar";
import type { Match } from "@/lib/db";

const STAGE_ORDER = ["r32", "r16", "qf", "sf", "final", "bronze"] as const;
const STAGE_LABELS: Record<string, string> = {
  r32: "Round of 32", r16: "Round of 16", qf: "Quarter-Finals",
  sf: "Semi-Finals", final: "Final", bronze: "Bronze Final",
};

export interface BracketMatch extends Match {
  homeTeamName: string;
  awayTeamName: string;
  homeOwner: { name: string; avatarUrl: string | null } | null;
  awayOwner: { name: string; avatarUrl: string | null } | null;
}

export function BracketView({
  matchesByStage,
  selectedStage,
  onStageSelect,
}: {
  matchesByStage: Record<string, BracketMatch[]>;
  selectedStage: string;
  onStageSelect: (s: string) => void;
}) {
  const availableStages = STAGE_ORDER.filter((s) => (matchesByStage[s]?.length ?? 0) > 0);
  const matches = matchesByStage[selectedStage] ?? [];

  if (availableStages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
        <span className="text-4xl">🗂</span>
        <p className="text-ink-2 text-sm">Bracket not yet available.</p>
        <p className="text-ink-3 text-xs">
          Admin will add knockout matches once the group stage is complete.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Round tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {availableStages.map((s) => (
          <button key={s} onClick={() => onStageSelect(s)}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              selectedStage === s ? "bg-brand text-brand-on" : "bg-paper-2 text-ink-2 hover:text-ink"
            }`}>
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Matches */}
      <div className="space-y-3">
        {matches.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-8">No matches for this round yet.</p>
        ) : (
          matches
            .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime())
            .map((match) => <BracketMatchCard key={match.id} match={match} />)
        )}
      </div>
    </div>
  );
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const finished = match.status === "finished";
  const live = match.status === "live";
  const kickoffStr = new Date(match.kickoff_utc).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const homeWon = finished && (
    match.went_to_shootout ? match.shootout_winner === "home" : (match.home_goals ?? 0) > (match.away_goals ?? 0)
  );
  const awayWon = finished && !homeWon;

  return (
    <div className="rounded-xl bg-surface border border-line overflow-hidden shadow-sm">
      {/* Match meta */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs text-ink-3">{kickoffStr}</span>
        {live && <span className="text-xs text-green-ink font-semibold animate-pulse">● LIVE</span>}
        {finished && <span className="text-xs text-ink-3">Full time</span>}
      </div>

      {/* Teams */}
      <div className="px-4 pb-3 space-y-2">
        <TeamRow
          name={match.homeTeamName}
          code={match.home_team_code}
          goals={finished || live ? match.home_goals : null}
          owner={match.homeOwner}
          won={homeWon}
        />
        <TeamRow
          name={match.awayTeamName}
          code={match.away_team_code}
          goals={finished || live ? match.away_goals : null}
          owner={match.awayOwner}
          won={awayWon}
        />
        {match.went_to_shootout && finished && (
          <p className="text-xs text-ink-3 text-center">
            ({match.shootout_winner === "home" ? match.homeTeamName : match.awayTeamName} won on penalties)
          </p>
        )}
      </div>
    </div>
  );
}

function TeamRow({
  name,
  code,
  goals,
  owner,
  won,
}: {
  name: string;
  code: string | null;
  goals: number | null | undefined;
  owner: { name: string; avatarUrl: string | null } | null;
  won: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${won ? "bg-gold-soft" : ""}`}>
      {/* User avatar (if drafted) */}
      {owner ? (
        <Avatar name={owner.name} url={owner.avatarUrl} size="xs" />
      ) : (
        <div className="w-5 h-5 shrink-0" />
      )}

      {/* Team code */}
      <span className="text-xs font-mono text-ink-3 w-7 shrink-0">{code ?? "TBD"}</span>

      {/* Team name */}
      <span className={`flex-1 text-sm font-medium truncate ${won ? "text-gold-ink font-bold" : "text-ink"}`}>
        {name}
      </span>

      {/* Owner name */}
      {owner && (
        <span className="text-xs text-ink-3 shrink-0 hidden sm:block">{owner.name}</span>
      )}

      {/* Goals */}
      <span className={`font-num text-lg font-black tabular-nums w-6 text-right shrink-0 ${won ? "text-gold-ink" : "text-ink"}`}>
        {goals !== null && goals !== undefined ? goals : "–"}
      </span>
    </div>
  );
}
