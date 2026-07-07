"use client";

import { useRef, useState } from "react";
import { ScreenHeader, Scroll, Card, Pill, Banner, PtsBadge, CountryLogo, UserName, nameToColor } from "@/components/wc-ui";
import { DeadlineStatus } from "./DeadlineStatus";
import { savePrediction } from "@/app/predict/actions";
import type { Match } from "@/lib/db";

type SaveState = "idle" | "pending" | "saving" | "saved" | "error" | "locked";

interface OtherPred {
  authId: string;
  displayName: string;
  avatarUrl: string | null;
  home: number | null;
  away: number | null;
}

interface Props {
  grouped: Record<string, Match[]>;
  teamNames: Record<string, string>;
  teamLogoByCode: Record<string, string | null>;
  predMap: Record<string, { home: number; away: number }>;
  othersByMatch: Record<string, OtherPred[]>;
  deadline: string | null;
  isLocked: boolean;
}

function pts(pred: { h: number; a: number }, result: { h: number; a: number }): number {
  if (pred.h === result.h && pred.a === result.a) return 3;
  const predOut = pred.h > pred.a ? "W" : pred.h < pred.a ? "L" : "D";
  const resOut = result.h > result.a ? "W" : result.h < result.a ? "L" : "D";
  return predOut === resOut ? 2 : 0;
}

const VERDICT = {
  3: { soft: "bg-green-soft", ink: "text-green-ink", pill: "green" as const, label: "Exact +3" },
  2: { soft: "bg-gold-soft", ink: "text-gold-ink", pill: "gold" as const, label: "Outcome +2" },
  0: { soft: "bg-red-soft", ink: "text-red-ink", pill: "red" as const, label: "Missed +0" },
} as const;

export function PredictionClient({ grouped, teamNames, teamLogoByCode, predMap, othersByMatch, deadline, isLocked }: Props) {
  const groups = Object.keys(grouped).sort();
  const [selectedGroup, setSelectedGroup] = useState(groups[0] ?? "A");
  const [matchIdx, setMatchIdx] = useState(0);

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

  function handleGroupChange(g: string) {
    setSelectedGroup(g);
    setMatchIdx(0);
  }

  const matches = grouped[selectedGroup] ?? [];
  const match = matches[matchIdx];
  const matchScore = match ? (scores[match.id] ?? { home: null, away: null }) : { home: null, away: null };
  const locked = isLocked || (match ? saveStates[match.id] === "locked" : false);
  const totalMatches = Object.values(grouped).flat().length;
  const setCount = Object.values(scores).filter((s) => s.home !== null && s.away !== null).length;

  const played = match?.status === "finished";
  const result = played
    ? { h: match.home_goals ?? 0, a: match.away_goals ?? 0 }
    : null;
  const myPick = matchScore.home !== null && matchScore.away !== null
    ? { h: matchScore.home, a: matchScore.away }
    : null;
  const myPts = myPick && result ? pts(myPick, result) : null;
  const v = myPts != null ? VERDICT[myPts as 0 | 2 | 3] : null;

  const others = match ? (othersByMatch[match.id] ?? []) : [];
  const othersWithPts = others.map((o) => {
    const oPick = o.home !== null && o.away !== null ? { h: o.home, a: o.away } : null;
    const oPts = oPick && result ? pts(oPick, result) : null;
    return { ...o, pick: oPick, pts: oPts };
  }).sort((a, b) => {
    // Current user always first (but here they are already in 'others'), so just sort by pts desc
    return (b.pts ?? -1) - (a.pts ?? -1);
  });
  const pickedCount = others.filter((o) => o.home !== null).length;

  return (
    <>
      <ScreenHeader
        title="Predict"
        sub={`Group ${selectedGroup} · review & set picks`}
        right={<Pill color="brand">{setCount} / {totalMatches} set</Pill>}
      />
      <Scroll>
        <DeadlineStatus deadline={deadline} isLockedServer={isLocked} />

        {/* Group selector */}
        <div className="flex gap-[7px] overflow-x-auto pb-0.5 -mx-0.5">
          {groups.map((g) => {
            const on = g === selectedGroup;
            return (
              <button
                key={g}
                type="button"
                onClick={() => handleGroupChange(g)}
                className={
                  "shrink-0 w-[46px] h-[46px] rounded-[13px] font-display font-bold text-[19px] cursor-pointer border-[1.5px] " +
                  (on ? "border-brand bg-brand text-brand-on" : "border-line bg-surface text-ink")
                }
              >
                {g}
              </button>
            );
          })}
        </div>

        {/* Match pager */}
        {matches.length > 0 && (
          <div className="flex gap-1.5 justify-between">
            {matches.map((m, i) => {
              const on = i === matchIdx;
              const done = m.status === "finished";
              const hasPick = scores[m.id]?.home !== null && scores[m.id]?.away !== null;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMatchIdx(i)}
                  className={
                    "relative flex-1 min-h-11 px-0.5 py-[5px] rounded-[9px] grid gap-px place-items-center leading-[1.15] text-[11px] font-bold cursor-pointer " +
                    (on
                      ? "border-[1.5px] border-ink bg-ink text-white"
                      : done
                      ? "border border-line bg-paper-3 text-ink-2"
                      : "border border-line bg-surface text-ink-2")
                  }
                >
                  <span>{m.home_team_code ?? "?"}</span>
                  <span className="text-[8px] font-semibold opacity-60">v</span>
                  <span>{m.away_team_code ?? "?"}</span>
                  <span className={"absolute top-1 right-[5px] w-1.5 h-1.5 rounded-pill " + (done || hasPick ? "bg-green" : "bg-gold")} />
                </button>
              );
            })}
          </div>
        )}

        {/* Focused match card */}
        {match && (
          <Card className="px-4 pt-4 pb-[18px]">
            {/* Header row */}
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-ink-2 text-[12.5px] font-semibold">
                {new Date(match.kickoff_utc).toLocaleString(undefined, {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
              {played
                ? v ? <Pill color={v.pill}>{v.label}</Pill> : <Pill color="ink">No pick</Pill>
                : <SaveIndicator state={saveStates[match.id] ?? "idle"} />}
            </div>

            {/* Country logos + names — 3-col grid */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 mb-2">
              <div className="grid justify-items-center gap-[9px]">
                <CountryLogo code={match.home_team_code ?? ""} logoUrl={teamLogoByCode[match.home_team_code ?? ""] ?? null} size={62} />
                <div className="font-display font-bold text-[17px] uppercase text-center leading-none">
                  {teamNames[match.home_team_code ?? ""] ?? match.home_team_code ?? "TBD"}
                </div>
              </div>
              <div className="font-num font-bold text-xl text-ink-3">VS</div>
              <div className="grid justify-items-center gap-[9px]">
                <CountryLogo code={match.away_team_code ?? ""} logoUrl={teamLogoByCode[match.away_team_code ?? ""] ?? null} size={62} />
                <div className="font-display font-bold text-[17px] uppercase text-center leading-none">
                  {teamNames[match.away_team_code ?? ""] ?? match.away_team_code ?? "TBD"}
                </div>
              </div>
            </div>

            {played && result ? (
              <>
                {/* Actual score — aligned with country columns */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 mb-1">
                  <div className="text-center">
                    <div className="text-[10.5px] font-bold tracking-[.05em] text-ink-3 uppercase mb-1">Result</div>
                    <div className="font-num font-black text-[40px] leading-none tabular-nums text-ink">
                      {result.h}
                    </div>
                  </div>
                  <div className="font-num font-bold text-2xl text-ink-3 self-end pb-1">–</div>
                  <div className="text-center">
                    <div className="text-[10.5px] font-bold tracking-[.05em] text-ink-3 uppercase mb-1">&nbsp;</div>
                    <div className="font-num font-black text-[40px] leading-none tabular-nums text-ink">
                      {result.a}
                    </div>
                  </div>
                </div>

                {/* Your pick — aligned with country columns */}
                <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 rounded-lg px-2 py-2.5 mb-1 ${v?.soft ?? "bg-paper-2"}`}>
                  <div className="text-center">
                    <div className={`text-[10.5px] font-bold tracking-[.05em] uppercase mb-1 ${v?.ink ?? "text-ink-3"}`}>Your pick</div>
                    <div className={`font-num font-black text-[32px] leading-none tabular-nums ${v?.ink ?? "text-ink"}`}>
                      {myPick?.h ?? "–"}
                    </div>
                  </div>
                  <div className={`font-num font-bold text-xl self-end pb-0.5 ${v?.ink ?? "text-ink-3"}`}>–</div>
                  <div className="text-center">
                    <div className="text-[10.5px] font-bold tracking-[.05em] uppercase mb-1">&nbsp;</div>
                    <div className={`font-num font-black text-[32px] leading-none tabular-nums ${v?.ink ?? "text-ink"}`}>
                      {myPick?.a ?? "–"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Unplayed — steppers aligned with country columns */
              <div className="grid grid-cols-2 gap-3 mb-1">
                <StepBox
                  value={matchScore.home ?? 0}
                  disabled={locked}
                  onDecrement={() => handleChange(match.id, "home", Math.max(0, (matchScore.home ?? 0) - 1))}
                  onIncrement={() => handleChange(match.id, "home", Math.min(20, (matchScore.home ?? 0) + 1))}
                />
                <StepBox
                  value={matchScore.away ?? 0}
                  disabled={locked}
                  onDecrement={() => handleChange(match.id, "away", Math.max(0, (matchScore.away ?? 0) - 1))}
                  onIncrement={() => handleChange(match.id, "away", Math.min(20, (matchScore.away ?? 0) + 1))}
                />
              </div>
            )}
          </Card>
        )}

        {/* Everyone's guesses */}
        {match && (
          played ? (
            <Card className="px-2 pt-1.5 pb-2">
              <div className="text-[11px] font-bold tracking-[.05em] text-ink-3 uppercase px-2 pt-2.5 pb-1.5">
                How everyone guessed
              </div>
              {othersWithPts.map((o) => (
                <div key={o.authId} className="flex items-center gap-2 px-2.5 py-2 rounded-sm">
                  <div className="flex-1 min-w-0">
                    <UserName name={o.displayName} avatarUrl={o.avatarUrl} color={nameToColor(o.displayName)} size={24} bold={false} dim />
                  </div>
                  <span className="font-num font-bold text-[15px] text-ink-2 w-[52px] text-center tabular-nums shrink-0">
                    {o.pick ? `${o.pick.h} – ${o.pick.a}` : <span className="text-xs text-ink-3 italic">–</span>}
                  </span>
                  <span className="w-[34px] text-right shrink-0">
                    {o.pts != null && <PtsBadge value={o.pts} />}
                  </span>
                </div>
              ))}
            </Card>
          ) : (
            <Banner tone="brand" icon="👥">
              {pickedCount} of {others.length + 1} friends have locked a pick for this match.
            </Banner>
          )
        )}

        {/* Prev / Next */}
        {matches.length > 1 && (
          <div className="flex justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setMatchIdx((i) => Math.max(0, i - 1))}
              className="flex-1 h-11 rounded-pill border-[1.5px] border-line-2 bg-surface font-bold text-ink cursor-pointer"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setMatchIdx((i) => Math.min(matches.length - 1, i + 1))}
              className="flex-1 h-11 rounded-pill border-[1.5px] border-line-2 bg-surface font-bold text-ink cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}
      </Scroll>
    </>
  );
}

function StepBox({
  value,
  disabled,
  onDecrement,
  onIncrement,
}: {
  value: number;
  disabled: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="grid justify-items-center gap-2.5 bg-paper-2 rounded-md px-2 py-3.5">
      <div className="font-num font-bold text-[50px] leading-none tabular-nums">{value}</div>
      <div className="flex gap-[9px]">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disabled}
          className="w-[50px] h-[50px] rounded-[14px] border-[1.5px] border-line-2 bg-surface text-2xl font-bold cursor-pointer text-ink disabled:opacity-40"
        >
          −
        </button>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disabled}
          className="w-[50px] h-[50px] rounded-[14px] bg-brand text-brand-on text-2xl font-bold cursor-pointer border-0 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, [string, string]> = {
    idle:    ["", ""],
    pending: ["…",       "text-ink-3"],
    saving:  ["Saving…", "text-ink-3"],
    saved:   ["✓ Saved", "text-green-ink"],
    error:   ["✗ Error", "text-red-ink"],
    locked:  ["🔒",      "text-ink-3"],
  };
  const [label, cls] = map[state];
  if (!label) return null;
  return <span className={`text-xs font-medium ${cls}`}>{label}</span>;
}
