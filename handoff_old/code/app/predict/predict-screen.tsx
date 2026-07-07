"use client";
// ============================================================
// app/(app)/predict/predict-screen.tsx — group-stage Predict
// ------------------------------------------------------------
// The core screen. Worked port of the prototype's PredictReview
// (reference/prototype-src/app/screens_shared.jsx) to token
// utilities. Note the 3-way result coloring: green = exact (+3),
// gold = correct outcome only (+2), red = wrong (+0). SPEC §5.2/§6.
//
// Data is abstracted behind props/types so this file is about
// MARKUP. Wire it to your real predictions store; autosave
// (debounced upsert) on each stepper change, hard-lock past the
// deadline server-side.
// ============================================================
import * as React from "react";
import {
  ScreenHeader, Scroll, Card, Pill, Btn, Banner, UserName, PtsBadge, CountryLogo,
} from "@/components/wc-ui";

type Score = { h: number; a: number };
type Guess = { userId: string; name: string; color: string; you?: boolean; h: number; a: number; pts: number | null };
export type Match = {
  home: string; away: string; homeName: string; awayName: string;
  homeTheme: string; awayTheme: string;
  time: string; result: Score | null; others: Guess[];
};

const outcome = (h: number, a: number) => (h > a ? "W" : h < a ? "L" : "D");

const VERDICT = {
  green: { soft: "bg-green-soft", ink: "text-green-ink", pill: "green" as const, label: "Exact +3" },
  gold: { soft: "bg-gold-soft", ink: "text-gold-ink", pill: "gold" as const, label: "Outcome +2" },
  red: { soft: "bg-red-soft", ink: "text-red-ink", pill: "red" as const, label: "Missed +0" },
};

export function PredictScreen({
  group = "A",
  groups,
  matches,
  waveIntensity = 1,
  onSavePick,
}: {
  group?: string;
  groups: string[];
  matches: Match[];
  waveIntensity?: number;
  onSavePick?: (matchIdx: number, pick: Score) => void;
}) {
  const [grp, setGrp] = React.useState(group);
  const [idx, setIdx] = React.useState(0);
  const [picks, setPicks] = React.useState<Score[]>(() => matches.map(() => ({ h: 0, a: 0 })));

  const m = matches[idx];
  const played = !!m.result;
  const pk = picks[idx];

  const setPick = (side: "h" | "a", d: number) => {
    if (played) return;
    setPicks((ps) => {
      const next = ps.map((p, i) => (i === idx ? { ...p, [side]: Math.max(0, Math.min(20, p[side] + d)) } : p));
      onSavePick?.(idx, next[idx]); // debounced autosave in production
      return next;
    });
  };

  const exact = played && pk.h === m.result!.h && pk.a === m.result!.a;
  const rightOutcome = played && outcome(pk.h, pk.a) === outcome(m.result!.h, m.result!.a);
  const verdict = !played ? null : exact ? "green" : rightOutcome ? "gold" : "red";
  const v = verdict ? VERDICT[verdict] : null;

  const TeamBig = ({ code, name, theme }: { code: string; name: string; theme: string }) => (
    <div className="grid justify-items-center gap-[9px]">
      <CountryLogo code={code} themeColor={theme} size={62} />
      <div className="font-display font-bold text-[17px] uppercase text-center leading-none">{name}</div>
    </div>
  );

  const StepBox = ({ side }: { side: "h" | "a" }) => (
    <div className="grid justify-items-center gap-2.5 bg-paper-2 rounded-md px-2 py-3.5">
      <div className="font-num font-bold text-[50px] leading-none tabular-nums">{pk[side]}</div>
      <div className="flex gap-[9px]">
        <button
          type="button"
          onClick={() => setPick(side, -1)}
          className="w-[50px] h-[50px] rounded-[14px] border-[1.5px] border-line-2 bg-surface text-2xl font-bold cursor-pointer text-ink"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setPick(side, 1)}
          className="w-[50px] h-[50px] rounded-[14px] bg-brand text-brand-on text-2xl font-bold cursor-pointer border-0"
        >
          +
        </button>
      </div>
    </div>
  );

  const others = (m.others || []).slice().sort((a, b) => {
    if (a.you) return -1;
    if (b.you) return 1;
    return (b.pts ?? -1) - (a.pts ?? -1);
  });

  const setCount = picks.filter((p) => p.h || p.a).length;

  return (
    <>
      <ScreenHeader
        title="Predict"
        sub={`Group ${grp} · review & set picks`}
        waveIntensity={waveIntensity}
        right={<Pill color="brand">{setCount} / {matches.length} set</Pill>}
      />
      <Scroll>
        {/* group selector */}
        <div className="flex gap-[7px] overflow-x-auto pb-0.5 -mx-0.5">
          {groups.map((g) => {
            const on = g === grp;
            return (
              <button
                key={g}
                type="button"
                onClick={() => { setGrp(g); setIdx(0); }}
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

        {/* match pager */}
        <div className="flex gap-1.5 justify-between">
          {matches.map((mm, i) => {
            const on = i === idx;
            const done = !!mm.result;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={
                  "relative flex-1 min-h-11 px-0.5 py-[5px] rounded-[9px] grid gap-px place-items-center leading-[1.15] text-[11px] font-bold cursor-pointer " +
                  (on ? "border-[1.5px] border-ink bg-ink text-white" : done ? "border border-line bg-paper-3 text-ink-2" : "border border-line bg-surface text-ink-2")
                }
              >
                <span>{mm.home}</span>
                <span className="text-[8px] font-semibold opacity-60">v</span>
                <span>{mm.away}</span>
                <span className={"absolute top-1 right-[5px] w-1.5 h-1.5 rounded-pill " + (done ? "bg-green" : "bg-gold")} />
              </button>
            );
          })}
        </div>

        {/* focused match */}
        <Card className="px-4 pt-4 pb-[18px]">
          <div className="flex justify-between items-center mb-3.5">
            <span className="text-ink-2 text-[12.5px] font-semibold">{m.time.replace(/ · .*/, "")}</span>
            {played ? <Pill color={v!.pill}>{v!.label}</Pill> : <Pill color="brand">Upcoming</Pill>}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 mb-[18px]">
            <TeamBig code={m.home} name={m.homeName} theme={m.homeTheme} />
            <div className="font-num font-bold text-xl text-ink-3">VS</div>
            <TeamBig code={m.away} name={m.awayName} theme={m.awayTheme} />
          </div>

          {played ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-paper-2 rounded-md px-2 py-3 text-center">
                <div className="text-[10.5px] font-bold tracking-[.05em] text-ink-3 uppercase mb-1">Your pick</div>
                <div className="font-num font-bold text-[32px]">{pk.h} – {pk.a}</div>
              </div>
              <div className={"rounded-md px-2 py-3 text-center " + v!.soft}>
                <div className={"text-[10.5px] font-bold tracking-[.05em] uppercase mb-1 " + v!.ink}>Result</div>
                <div className={"font-num font-bold text-[32px] " + v!.ink}>{m.result!.h} – {m.result!.a}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <StepBox side="h" />
                <StepBox side="a" />
              </div>
              <Btn kind="primary" full className="min-h-[50px]">Save pick</Btn>
            </>
          )}
        </Card>

        {/* everyone's guesses (played) or progress (upcoming) */}
        {played ? (
          <Card className="px-2 pt-1.5 pb-2">
            <div className="text-[11px] font-bold tracking-[.05em] text-ink-3 uppercase px-2 pt-2.5 pb-1.5">
              How everyone guessed
            </div>
            {others.map((o, j) => (
              <div
                key={j}
                className={"flex items-center justify-between px-2.5 py-2 rounded-sm " + (o.you ? "bg-brand-soft" : "bg-transparent")}
              >
                <div className="min-w-0 flex-1">
                  <UserName name={o.name} color={o.color} you={o.you} size={26} />
                </div>
                <span className="font-num font-bold text-[15px] text-ink-2 w-[52px] text-center tabular-nums">{o.h} – {o.a}</span>
                <span className="w-[34px] text-right">{o.pts != null && <PtsBadge value={o.pts} />}</span>
              </div>
            ))}
          </Card>
        ) : (
          <Banner tone="brand" icon="👥">7 of 10 friends have locked a pick for this match.</Banner>
        )}

        {/* prev / next */}
        <div className="flex justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            className="flex-1 h-11 rounded-pill border-[1.5px] border-line-2 bg-surface font-bold text-ink cursor-pointer"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(matches.length - 1, i + 1))}
            className="flex-1 h-11 rounded-pill border-[1.5px] border-line-2 bg-surface font-bold text-ink cursor-pointer"
          >
            Next →
          </button>
        </div>
      </Scroll>
    </>
  );
}
