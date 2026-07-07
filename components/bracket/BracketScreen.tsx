"use client";
// Ported from handoff/code/app/bracket/bracket-screen.tsx — KNOCKOUT Bracket tab.
// Path-tracing UI: tap a team to follow its route to the Final. Viewer's teams ★.
import * as React from "react";
import { ScreenHeader, Scroll, Card, Pill, Banner, CountryLogo } from "@/components/wc-ui";
import { slotLabel, slotPrefix, type LabelNode } from "@/lib/bracket-label";

// win: slot is filled by the WINNER of the feeder match (all rounds except Bronze)
// lose: slot is filled by the LOSER  of the feeder match (Bronze Final)
export type Slot = string | { win: string } | { lose: string } | null;

export type BracketMatch = {
  id: string;
  home: Slot;
  away: Slot;
  result?: { h: number; a: number };
  winner?: string;
  loser?: string;
};
export type BracketRound = { id: string; label: string; short: string; matches: BracketMatch[] };
export type Bracket = { rounds: BracketRound[] };

type TeamOwner = { name: string; color: string; avatarUrl?: string | null };
const monogram = (s: string) => s.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

// Extract feeder match id and outcome from a Slot reference
function slotRef(slot: Slot): { matchId: string; outcome: 'winner' | 'loser' } | null {
  if (!slot || typeof slot === "string") return null;
  if ("win" in slot) return { matchId: slot.win, outcome: 'winner' };
  return { matchId: slot.lose, outcome: 'loser' };
}

export function BracketScreen({
  bracket,
  teamNames,
  teamLogoByCode = {},
  teamOwners = {},
  matchPoints = {},
  myTeams = [],
  waveIntensity = 1,
}: {
  bracket: Bracket;
  teamNames: Record<string, string>;
  teamLogoByCode?: Record<string, string | null>;
  teamOwners?: Record<string, TeamOwner>;
  matchPoints?: Record<string, Record<string, number>>;
  myTeams?: string[];
  waveIntensity?: number;
}) {
  const teamName = (code: string) => teamNames[code] ?? code;
  const [round, setRound] = React.useState(bracket.rounds[0]?.id ?? "r32");
  const [hi, setHi] = React.useState<string | null>(null);

  const mById = React.useMemo(() => {
    const m: Record<string, BracketMatch> = {};
    bracket.rounds.forEach((r) => r.matches.forEach((x) => { m[x.id] = x; }));
    return m;
  }, [bracket]);

  // LabelNode index for the shared slot-label helper — no UUIDs exposed to UI
  const labelIdx = React.useMemo<Record<string, LabelNode>>(() => {
    return Object.fromEntries(
      Object.entries(mById).map(([id, m]) => {
        const homeRef = slotRef(m.home);
        const awayRef = slotRef(m.away);
        return [
          id,
          {
            winner: m.winner ?? null,
            loser: m.loser ?? null,
            homeCode: typeof m.home === "string" ? m.home : null,
            awayCode: typeof m.away === "string" ? m.away : null,
            homeFeedId: homeRef?.matchId ?? null,
            awayFeedId: awayRef?.matchId ?? null,
            homeFeedOutcome: homeRef?.outcome ?? 'winner',
            awayFeedOutcome: awayRef?.outcome ?? 'winner',
          },
        ];
      })
    );
  }, [mById]);

  const labelOf = (rid: string) => bracket.rounds.find((r) => r.id === rid)?.short ?? rid;

  // Resolve a slot to the actual team code, if the feeder match is decided.
  const resolve = (slot: Slot): string | null => {
    if (!slot) return null;
    if (typeof slot === "string") return slot;
    const ref = slotRef(slot)!;
    const m = mById[ref.matchId];
    if (!m) return null;
    return ref.outcome === 'winner' ? (m.winner ?? null) : (m.loser ?? null);
  };

  // Can `team` potentially reach this slot?
  // For decided matches, only the actual winner/loser (per outcome) qualifies.
  // For undecided matches, either participant might qualify.
  const canReach = (slot: Slot, team: string | null): boolean => {
    if (!slot || !team) return false;
    if (typeof slot === "string") return slot === team;
    const ref = slotRef(slot)!;
    const m = mById[ref.matchId];
    if (!m) return false;
    if (m.winner) {
      const qualifies = ref.outcome === 'winner' ? m.winner : m.loser;
      return qualifies === team;
    }
    return canReach(m.home, team) || canReach(m.away, team);
  };

  // Find the next match a team would advance to after matchId (winner path only,
  // used for the "Advances to →" navigation button; loser path shown by trace dots).
  const nextOf = (id: string) => {
    for (const r of bracket.rounds)
      for (const m of r.matches) {
        const hRef = slotRef(m.home);
        const aRef = slotRef(m.away);
        // Only follow winner-based links for the "Advances to" button
        if ((hRef?.outcome === 'winner' && hRef.matchId === id) ||
            (aRef?.outcome === 'winner' && aRef.matchId === id))
          return { round: r.id, match: m };
      }
    return null;
  };

  const roundInvolves = (rid: string, team: string | null) =>
    !!team && (bracket.rounds.find((r) => r.id === rid)?.matches ?? [])
      .some((m) => canReach(m.home, team) || canReach(m.away, team));

  const rd = bracket.rounds.find((r) => r.id === round) ?? bracket.rounds[0];

  const SlotRow = ({ slot, m, side }: { slot: Slot; m: BracketMatch; side: "h" | "a" }) => {
    const code = resolve(slot);
    const isWin = !!code && m.winner === code;
    const isLoser = !!m.winner && !!code && code !== m.winner;
    const isMine = !!code && myTeams.includes(code);
    const isHi = !!code && hi === code;
    const ref = slotRef(slot);
    const pendingLabel = !code && ref
      ? slotLabel(null, ref.matchId, labelIdx, 0, ref.outcome)
      : null;
    const score = m.result ? m.result[side] : null;
    const owner = code ? teamOwners[code] ?? null : null;
    const pts = code && score != null ? matchPoints[m.id]?.[code] ?? null : null;
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
        {/* Owner avatar */}
        {code && owner ? (
          owner.avatarUrl ? (
            <img src={owner.avatarUrl} alt={owner.name} className="w-[28px] h-[28px] rounded-pill object-cover shrink-0" />
          ) : (
            <span
              className="grid place-items-center w-[28px] h-[28px] rounded-pill text-white font-num font-bold shrink-0"
              style={{ background: owner.color, fontSize: 10 }}
            >
              {monogram(owner.name)}
            </span>
          )
        ) : code ? (
          <span className="w-[28px] h-[28px] shrink-0" />
        ) : null}

        {/* Country crest */}
        {code ? (
          <CountryLogo code={code} logoUrl={teamLogoByCode[code] ?? null} size={22} />
        ) : (
          <span className="w-[22px] h-[26px] shrink-0 rounded-[6px] border-[1.5px] border-dashed border-line-2" />
        )}

        {code ? (
          <div className="flex-1 min-w-0 flex flex-col gap-[1px]">
            <div className={"truncate text-[14px] " + (isLoser ? "line-through text-ink-3 font-semibold" : isWin ? "font-extrabold text-ink" : "font-semibold text-ink-2")}>
              {teamName(code)}
              {isMine && <span title="your team" className="ml-1.5 text-brand-ink text-[13px]">★</span>}
            </div>
            {owner && (
              <span className="truncate text-[10.5px] font-semibold text-ink-3">{owner.name}</span>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-0 truncate text-[13px] font-semibold text-ink-3">
            {pendingLabel && pendingLabel !== "?"
              ? `${slotPrefix(ref?.outcome ?? 'winner')} ${pendingLabel}`
              : "TBD"}
          </div>
        )}
        <div className="shrink-0 flex flex-col items-end gap-[1px]">
          {score != null && (
            <span className={"font-num font-extrabold text-[18px] tabular-nums " + (isWin ? "text-ink" : "text-ink-3")}>
              {score}
            </span>
          )}
          {pts !== null && (
            <span className={"font-num font-bold text-[10.5px] tabular-nums " + (pts > 0 ? "text-brand-ink" : "text-ink-3")}>
              +{pts}pts
            </span>
          )}
        </div>
      </div>
    );
  };

  if (!rd) return null;

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
              <CountryLogo code={hi} logoUrl={teamLogoByCode[hi] ?? null} size={18} />
              {hi} path ✕
            </button>
          ) : (
            <Pill color="ink">32 teams</Pill>
          )
        }
      />
      <Scroll>
        {/* Round selector */}
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

        {rd.matches.length === 0 && (
          <Card className="px-4 py-6 text-center">
            <p className="text-ink-3 text-sm">No matches yet for this round.</p>
          </Card>
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
                    {nx.round === "final" ? 1 : (bracket.rounds.find((r) => r.id === nx.round)?.matches.indexOf(nx.match) ?? -1) + 1}
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
