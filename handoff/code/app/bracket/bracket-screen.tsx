"use client";
// ============================================================
// app/(app)/bracket/bracket-screen.tsx — KNOCKOUT "Bracket" tab
// ------------------------------------------------------------
// Worked port of the prototype's BracketScreen
// (reference/prototype-src/app/screens_draft.jsx). Mobile-first,
// round-by-round (R32 → Final). Tap any team to TRACE ITS PATH to the
// final — involved matches stay lit, the rest dim, and the round
// selector dots the rounds the team can still reach. The viewer's
// drafted teams are marked ★ throughout.
//
// MARKUP + the path-tracing UI logic (all client-side, derived from
// the bracket prop). No data is mutated. Pass your real bracket tree
// and the viewer's drafted codes; everything else is computed here.
// ============================================================
import * as React from "react";
import { ScreenHeader, Scroll, Card, Pill, Banner, CountryLogo } from "@/components/wc-ui";

// A slot is either a concrete team code, or "winner of match X" (TBD).
export type Slot = string | { win: string } | null;
export type BracketMatch = {
  id: string;
  home: Slot;
  away: Slot;
  result?: { h: number; a: number };
  winner?: string;            // team code, once decided
};
export type BracketRound = { id: string; label: string; short: string; matches: BracketMatch[] };
export type Bracket = { rounds: BracketRound[] };

export function BracketScreen({
  bracket,
  teamName,
  myTeams = [],
  waveIntensity = 1,
}: {
  bracket: Bracket;
  teamName: (code: string) => string;   // code → display name (e.g. teams[code].name)
  myTeams?: string[];                    // viewer's drafted codes
  waveIntensity?: number;
}) {
  const [round, setRound] = React.useState(bracket.rounds[0].id);
  const [hi, setHi] = React.useState<string | null>(null); // highlighted team code

  const mById = React.useMemo(() => {
    const m: Record<string, BracketMatch> = {};
    bracket.rounds.forEach((r) => r.matches.forEach((x) => { m[x.id] = x; }));
    return m;
  }, [bracket]);

  const labelOf = (rid: string) => bracket.rounds.find((r) => r.id === rid)!.short;

  // resolve a slot to a concrete code, if known
  const resolve = (slot: Slot): string | null => {
    if (!slot) return null;
    if (typeof slot === "string") return slot;
    const m = mById[slot.win];
    return m && m.winner ? m.winner : null;
  };
  // can `team` still arrive in `slot`? (walks the subtree of feeders)
  const canReach = (slot: Slot, team: string | null): boolean => {
    if (!slot || !team) return false;
    if (typeof slot === "string") return slot === team;
    const m = mById[slot.win];
    if (!m) return false;
    return canReach(m.home, team) || canReach(m.away, team);
  };
  // which match (and round) does this match's winner advance to?
  const nextOf = (id: string) => {
    for (const r of bracket.rounds)
      for (const m of r.matches) {
        const h = m.home, a = m.away;
        if ((h && typeof h !== "string" && h.win === id) || (a && typeof a !== "string" && a.win === id))
          return { round: r.id, match: m };
      }
    return null;
  };
  const roundInvolves = (rid: string, team: string | null) =>
    !!team && bracket.rounds.find((r) => r.id === rid)!.matches.some((m) => canReach(m.home, team) || canReach(m.away, team));

  const rd = bracket.rounds.find((r) => r.id === round)!;

  // one team line inside a match card
  const SlotRow = ({ slot, m, side }: { slot: Slot; m: BracketMatch; side: "h" | "a" }) => {
    const code = resolve(slot);
    const isWin = !!code && m.winner === code;
    const isMine = !!code && myTeams.includes(code);
    const isHi = !!code && hi === code;
    const cand =
      !code && slot && typeof slot !== "string" && slot.win
        ? [resolve(mById[slot.win].home), resolve(mById[slot.win].away)]
        : null;
    const score = m.result ? m.result[side] : null;
    return (
      <div
        onClick={() => code && setHi((h) => (h === code ? null : code))}
        className={
          "flex items-center gap-2.5 px-[11px] py-[9px] rounded-sm " +
          (code ? "cursor-pointer " : "cursor-default ") +
          (isHi ? "bg-brand-soft " : isWin ? "bg-paper-2 " : "bg-transparent ") +
          (code ? "opacity-100" : "opacity-70")
        }
      >
        {code ? (
          <CountryLogo code={code} size={26} />
        ) : (
          <span className="w-[26px] h-7 shrink-0 rounded-[7px] border-[1.5px] border-dashed border-line-2" />
        )}
        {code ? (
          <div className={"flex-1 min-w-0 truncate text-[14.5px] " + (isWin ? "font-extrabold text-ink" : "font-semibold text-ink-2")}>
            {teamName(code)}
          </div>
        ) : (
          <div className="flex-1 min-w-0 truncate text-[13px] font-semibold text-ink-3">
            Winner {slot && typeof slot !== "string" ? slot.win : ""}
            {cand && cand[0] && cand[1] ? " · " + cand[0] + " / " + cand[1] : ""}
          </div>
        )}
        {isMine && <span title="your team" className="shrink-0 text-brand-ink text-[13px]">★</span>}
        {score != null && (
          <span className={"shrink-0 font-num font-extrabold text-[18px] tabular-nums " + (isWin ? "text-ink" : "text-ink-3")}>
            {score}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <ScreenHeader
        title="Bracket"
        sub="Round of 32 → Final"
        waveIntensity={waveIntensity}
        brandTinted
        right={
          hi ? (
            <button
              type="button"
              onClick={() => setHi(null)}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-pill border-[1.5px] border-brand bg-brand-soft text-brand-ink font-bold text-[12.5px] cursor-pointer"
            >
              <CountryLogo code={hi} size={18} />
              {hi} path ✕
            </button>
          ) : (
            <Pill color="ink">32 teams</Pill>
          )
        }
      />
      <Scroll>
        {/* round selector */}
        <div className="flex gap-1.5 bg-paper-3 rounded-pill p-1">
          {bracket.rounds.map((r) => {
            const on = r.id === round;
            const dot = roundInvolves(r.id, hi);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRound(r.id)}
                className={
                  "relative flex-1 h-[38px] rounded-pill border-0 cursor-pointer font-bold text-[12.5px] " +
                  (on ? "bg-surface text-brand-ink shadow-sm" : "bg-transparent text-ink-2")
                }
              >
                {r.short}
                {dot && !on && (
                  <span className="absolute top-1.5 right-1/2 -mr-4 w-1.5 h-1.5 rounded-pill bg-brand" />
                )}
              </button>
            );
          })}
        </div>

        {hi && (
          <Banner tone="brand" icon="★">
            Following <b>{teamName(hi)}</b> — highlighted rounds show where they can still go.
          </Banner>
        )}

        {rd.matches.map((m, i) => {
          const nx = nextOf(m.id);
          const involved = hi && (canReach(m.home, hi) || canReach(m.away, hi));
          return (
            <Card
              key={m.id}
              className="p-1.5 transition-opacity"
              style={{ borderColor: involved ? "var(--brand)" : "var(--line)", opacity: hi && !involved ? 0.45 : 1 }}
            >
              <div className="flex items-center justify-between px-[9px] pt-1 pb-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-[.06em] text-ink-3">{rd.short} · Match {i + 1}</span>
                {m.winner ? <Pill color="green">✓ Decided</Pill> : <span className="text-[11px] font-bold text-ink-3">Upcoming</span>}
              </div>
              <SlotRow slot={m.home} m={m} side="h" />
              <div className="h-px bg-line mx-[11px] my-px" />
              <SlotRow slot={m.away} m={m} side="a" />
              {nx && (
                <button
                  type="button"
                  onClick={() => setRound(nx.round)}
                  className="flex items-center gap-1.5 w-full border-0 bg-transparent cursor-pointer px-[11px] pt-2 pb-[5px] text-brand-ink text-[12px] font-bold text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="shrink-0">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="truncate">
                    Advances to {labelOf(nx.round)} · Match{" "}
                    {nx.round === "final" ? 1 : bracket.rounds.find((r) => r.id === nx.round)!.matches.indexOf(nx.match) + 1}
                  </span>
                </button>
              )}
            </Card>
          );
        })}

        <div className="flex items-center gap-2 text-ink-3 text-[12.5px] px-1.5 pt-0.5">
          <span className="text-brand-ink text-[13px]">★</span> Your drafted teams · tap any team to trace its path to the Final.
        </div>
      </Scroll>
    </>
  );
}
