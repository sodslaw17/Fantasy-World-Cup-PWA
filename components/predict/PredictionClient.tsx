"use client";

import { useRef, useState } from "react";
import { DeadlineStatus } from "./DeadlineStatus";
import { ScoreInput } from "./ScoreInput";
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

  // Score state: matchId → { home: number|null, away: number|null }
  const [scores, setScores] = useState<Record<string, { home: number | null; away: number | null }>>(
    () => Object.fromEntries(
      Object.entries(predMap).map(([id, p]) => [id, { home: p.home, away: p.away }])
    )
  );

  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function handleChange(matchId: string, side: "home" | "away", value: number) {
    setScores((prev) => {
      const updated = { ...prev, [matchId]: { ...(prev[matchId] ?? { home: null, away: null }), [side]: value } };
      const { home, away } = updated[matchId];
      if (home !== null && away !== null) {
        if (timers.current[matchId]) clearTimeout(timers.current[matchId]);
        setSaveStates((s) => ({ ...s, [matchId]: "pending" }));
        timers.current[matchId] = setTimeout(() => doSave(matchId, home, away), 600);
      }
      return updated;
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
    <div className="min-h-screen flex flex-col pb-24">
      <header className="px-4 pt-5 pb-3 space-y-3">
        <h1 className="text-lg font-bold text-gold">Group Predictions</h1>
        <DeadlineStatus deadline={deadline} isLockedServer={isLocked} />
      </header>

      {/* Group tabs */}
      <div className="flex gap-1 px-4 overflow-x-auto pb-1 scrollbar-none">
        {groups.map((g) => {
          const done = (grouped[g] ?? []).filter((m) => scores[m.id]?.home !== null && scores[m.id]?.away !== null).length;
          const total = (grouped[g] ?? []).length;
          return (
            <button key={g} onClick={() => setSelectedGroup(g)}
              className={`shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                selectedGroup === g ? "bg-gold text-ink" : "bg-ink-soft text-paper/60 hover:text-paper"
              }`}>
              <span>{g}</span>
              <span className={`text-xs font-normal ${selectedGroup === g ? "text-ink/60" : "text-paper/30"}`}>
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 px-4 py-3 space-y-3">
        {matches.map((match) => {
          const matchScore = scores[match.id] ?? { home: null, away: null };
          const locked = isLocked || saveStates[match.id] === "locked";
          const kickoffStr = new Date(match.kickoff_utc).toLocaleString(undefined, {
            weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          });

          return (
            <div key={match.id} className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-paper/50">{kickoffStr}</span>
                <SaveIndicator state={saveStates[match.id] ?? "idle"} />
              </div>

              <div className="flex items-center gap-2">
                <span className="flex-1 text-right text-sm font-medium truncate">
                  {teamNames[match.home_team_code ?? ""] ?? match.home_team_code ?? "?"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <ScoreInput value={matchScore.home} disabled={locked}
                    onChange={(v) => handleChange(match.id, "home", v)} />
                  <span className="text-paper/30 text-xs font-bold w-3 text-center">–</span>
                  <ScoreInput value={matchScore.away} disabled={locked}
                    onChange={(v) => handleChange(match.id, "away", v)} />
                </div>
                <span className="flex-1 text-left text-sm font-medium truncate">
                  {teamNames[match.away_team_code ?? ""] ?? match.away_team_code ?? "?"}
                </span>
              </div>

              {match.status === "finished" && match.home_goals !== null && (
                <p className="text-center text-xs text-paper/40">
                  Result: {match.home_goals} – {match.away_goals}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, [string, string]> = {
    idle:    ["", ""],
    pending: ["…",       "text-paper/30"],
    saving:  ["Saving…", "text-paper/40"],
    saved:   ["✓ Saved", "text-accent-green"],
    error:   ["✗ Error", "text-accent-red"],
    locked:  ["🔒",      "text-paper/40"],
  };
  const [label, cls] = map[state];
  if (!label) return null;
  return <span className={`text-xs font-medium ${cls}`}>{label}</span>;
}
