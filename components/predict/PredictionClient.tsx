"use client";

import { useRef, useState } from "react";
import { DeadlineStatus } from "./DeadlineStatus";
import { savePrediction } from "@/app/predict/actions";
import type { Match } from "@/lib/db";

type SaveState = "idle" | "pending" | "saving" | "saved" | "error" | "locked";

interface Props {
  grouped: Record<string, Match[]>;
  teamNames: Record<string, string>;
  predMap: Record<string, { home: number; away: number }>;
  deadline: string | null;
  isLocked: boolean;
}

export function PredictionClient({ grouped, teamNames, predMap, deadline, isLocked }: Props) {
  const groups = Object.keys(grouped).sort();
  const [selectedGroup, setSelectedGroup] = useState(groups[0] ?? "A");

  // Score inputs: matchId-home / matchId-away → string value
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.entries(predMap).forEach(([matchId, pred]) => {
      init[`${matchId}-home`] = String(pred.home);
      init[`${matchId}-away`] = String(pred.away);
    });
    return init;
  });

  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function handleChange(matchId: string, side: "home" | "away", raw: string) {
    // Only allow whole non-negative numbers
    if (raw !== "" && (!/^\d+$/.test(raw) || parseInt(raw) > 99)) return;

    setScores((prev) => {
      const next = { ...prev, [`${matchId}-${side}`]: raw };
      const homeStr = side === "home" ? raw : (next[`${matchId}-home`] ?? "");
      const awayStr = side === "away" ? raw : (next[`${matchId}-away`] ?? "");
      const home = parseInt(homeStr);
      const away = parseInt(awayStr);

      if (timers.current[matchId]) clearTimeout(timers.current[matchId]);

      if (!isNaN(home) && !isNaN(away) && home >= 0 && away >= 0) {
        setSaveStates((s) => ({ ...s, [matchId]: "pending" }));
        timers.current[matchId] = setTimeout(() => {
          doSave(matchId, home, away);
        }, 600);
      }
      return next;
    });
  }

  async function doSave(matchId: string, home: number, away: number) {
    setSaveStates((s) => ({ ...s, [matchId]: "saving" }));
    const result = await savePrediction(matchId, home, away);
    setSaveStates((s) => ({
      ...s,
      [matchId]: result.locked ? "locked" : result.error ? "error" : "saved",
    }));
  }

  const matches = grouped[selectedGroup] ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 pt-5 pb-3 space-y-3">
        <h1 className="text-lg font-bold text-gold">Group Predictions</h1>
        <DeadlineStatus deadline={deadline} isLockedServer={isLocked} />
      </header>

      {/* Group tabs */}
      <div className="flex gap-1 px-4 overflow-x-auto pb-1 scrollbar-none">
        {groups.map((g) => {
          const groupPreds = (grouped[g] ?? []).filter(
            (m) => scores[`${m.id}-home`] !== undefined && scores[`${m.id}-away`] !== undefined
          ).length;
          const total = (grouped[g] ?? []).length;
          return (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                selectedGroup === g
                  ? "bg-gold text-ink"
                  : "bg-ink-soft text-paper/60 hover:text-paper"
              }`}
            >
              <span>{g}</span>
              <span className={`text-xs font-normal ${selectedGroup === g ? "text-ink/60" : "text-paper/30"}`}>
                {groupPreds}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Match cards */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            homeTeamName={teamNames[match.home_team_code ?? ""] ?? match.home_team_code ?? "?"}
            awayTeamName={teamNames[match.away_team_code ?? ""] ?? match.away_team_code ?? "?"}
            homeValue={scores[`${match.id}-home`] ?? ""}
            awayValue={scores[`${match.id}-away`] ?? ""}
            saveState={saveStates[match.id] ?? "idle"}
            isLocked={isLocked}
            onChange={(side, val) => handleChange(match.id, side, val)}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  homeTeamName,
  awayTeamName,
  homeValue,
  awayValue,
  saveState,
  isLocked,
  onChange,
}: {
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  homeValue: string;
  awayValue: string;
  saveState: SaveState;
  isLocked: boolean;
  onChange: (side: "home" | "away", value: string) => void;
}) {
  const locked = isLocked || saveState === "locked";
  const kickoff = new Date(match.kickoff_utc);
  const kickoffStr = kickoff.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const resultAvailable =
    match.status === "finished" &&
    match.home_goals !== null &&
    match.away_goals !== null;

  return (
    <div className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-3">
      {/* Kickoff + status */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-paper/50">{kickoffStr}</span>
        <SaveIndicator state={saveState} />
      </div>

      {/* Teams + inputs */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <span className="flex-1 text-right text-sm font-medium truncate">
          {homeTeamName}
        </span>

        {/* Score inputs */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ScoreInput
            value={homeValue}
            locked={locked}
            onChange={(v) => onChange("home", v)}
          />
          <span className="text-paper/30 text-sm font-bold">–</span>
          <ScoreInput
            value={awayValue}
            locked={locked}
            onChange={(v) => onChange("away", v)}
          />
        </div>

        {/* Away team */}
        <span className="flex-1 text-left text-sm font-medium truncate">
          {awayTeamName}
        </span>
      </div>

      {/* Actual result (if available) */}
      {resultAvailable && (
        <div className="text-center text-xs text-paper/50">
          Result: {match.home_goals} – {match.away_goals}
        </div>
      )}
    </div>
  );
}

function ScoreInput({
  value,
  locked,
  onChange,
}: {
  value: string;
  locked: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      value={value}
      placeholder="?"
      disabled={locked}
      onChange={(e) => onChange(e.target.value)}
      className="w-12 h-12 rounded-lg bg-ink border border-paper/20 text-center text-lg font-bold text-paper placeholder:text-paper/20 focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-40 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const configs: Record<SaveState, { label: string; className: string }> = {
    idle:    { label: "",        className: "" },
    pending: { label: "…",       className: "text-paper/30" },
    saving:  { label: "Saving…", className: "text-paper/40" },
    saved:   { label: "✓ Saved", className: "text-accent-green" },
    error:   { label: "✗ Error", className: "text-accent-red" },
    locked:  { label: "🔒",      className: "text-paper/40" },
  };
  const { label, className } = configs[state];
  if (!label) return null;
  return <span className={`text-xs font-medium ${className}`}>{label}</span>;
}
