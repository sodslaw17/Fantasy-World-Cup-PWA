"use client";
// ============================================================
// app/(app)/standings/standings-screen.tsx — PODIUM leaderboards
// ------------------------------------------------------------
// Worked port of the prototype's StandingsContent
// (reference/prototype-src/app/screens_shared.jsx). This is the
// PODIUM-STYLE LEADERBOARD hand-off: the shared <Podium> atom
// (components/wc-ui.tsx) wrapped in a tinted <PodiumCard>, with the
// 4th-place-onward rows beneath each.
//   • Overall leaders (gold podium, round avatars)
//   • Efficiency leaders — 1st side pot (green podium, squircle player icons)
//   • Discipline leaders — 2nd side pot, knockout only (red podium)
// Podium render order is 2-1-3; #1 is tallest. Gold podium tone is the
// only sanctioned gold usage here (winner/leaderboard moment).
//
// MARKUP only. Pass already-sorted/derived rows from your standings
// query — this file does not compute scoring.
// ============================================================
import * as React from "react";
import { ScreenHeader, Scroll, Card, Pill, Podium, UserName, PlayerName, CountryName } from "@/components/wc-ui";

type Variant = "user" | "player";

/* PodiumCard — tinted surface around the shared <Podium> atom. */
function PodiumCard({
  title,
  tone,
  entries,
  variant,
  valueClass,
}: {
  title: string;
  tone: "gold" | "green" | "red";
  entries: React.ComponentProps<typeof Podium>["entries"];
  variant: Variant;
  valueClass: string;
}) {
  const toneMap = {
    gold: "bg-gold-soft border-gold-line text-gold-ink",
    green: "bg-green-soft border-transparent text-green-ink",
    red: "bg-red-soft border-transparent text-red-ink",
  } as const;
  return (
    <Card className={"px-3.5 pt-4 pb-3.5 overflow-hidden " + toneMap[tone]}>
      <div className="text-center text-[11px] font-bold tracking-[.08em] mb-3.5">{title}</div>
      <Podium entries={entries} variant={variant} valueClass={valueClass} />
    </Card>
  );
}

// ── row shapes (already sorted by the caller) ──────────────────
export type StandingRow = { id: string; name: string; color: string; avatarUrl?: string | null; you?: boolean; value: number };
export type EffRow = {
  id: string; playerName: string; iconUrl?: string | null; ownerName: string; ownerColor: string; you?: boolean;
  rate: number; g: number; a: number; min: number;
};
export type DiscRow = { id: string; name: string; color: string; avatarUrl?: string | null; you?: boolean; cardPts: number };

const monogram = (s: string) => s.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function StandingsScreen({
  playerCount,
  combined = false,
  pointsRows,
  effRows,
  discRows,
  waveIntensity = 1,
}: {
  playerCount: number;
  combined?: boolean;            // knockout → adds discipline pot + "Overall"
  pointsRows: StandingRow[];     // sorted desc
  effRows: EffRow[];             // sorted desc by rate
  discRows?: DiscRow[];          // sorted desc by card pts (combined only)
  waveIntensity?: number;
}) {
  const ptsEntries = pointsRows.slice(0, 3).map((p, i) => ({
    place: (i + 1) as 1 | 2 | 3,
    initials: monogram(p.name),
    name: p.name.split(" ")[0],
    value: p.value,
    color: p.color,
  }));
  const effEntries = effRows.slice(0, 3).map((p, i) => ({
    place: (i + 1) as 1 | 2 | 3,
    initials: monogram(p.playerName.replace(/^[A-Z]\.\s*/, "")),
    name: p.playerName,
    value: p.rate.toFixed(4),
    color: p.ownerColor,
    sub: `${p.g}G+${p.a}A`,
    owner: { initials: monogram(p.you ? "You" : p.ownerName), name: p.you ? "You" : p.ownerName.split(" ")[0], color: p.ownerColor },
  }));
  const discEntries = (discRows || []).slice(0, 3).map((p, i) => ({
    place: (i + 1) as 1 | 2 | 3,
    initials: monogram(p.name),
    name: p.name.split(" ")[0],
    value: p.cardPts,
    color: p.color,
  }));

  return (
    <>
      <ScreenHeader
        title="Standings"
        sub={combined ? "Overall · group + knockout" : "72 / 72 matches played"}
        waveIntensity={waveIntensity}
        right={<Pill color="ink">{playerCount} players</Pill>}
      />
      <Scroll>
        {/* ----- Overall points ----- */}
        <PodiumCard title="🏆 OVERALL LEADERS" tone="gold" entries={ptsEntries} variant="user" valueClass="text-gold-ink" />
        {pointsRows.slice(3).map((p, i) => (
          <Card
            key={p.id}
            className={"flex items-center gap-3 px-3.5 py-[11px] " + (p.you ? "border-brand bg-brand-soft" : "")}
          >
            <span className="w-6 text-center text-ink-3 font-num font-bold text-[15px]">{i + 4}</span>
            <div className="flex-1 min-w-0">
              <UserName name={p.name} color={p.color} avatarUrl={p.avatarUrl} you={p.you} />
            </div>
            <span className="font-num font-bold text-[20px] tabular-nums">
              {p.value}
              <span className="text-[12px] text-ink-3 ml-0.5">pts</span>
            </span>
          </Card>
        ))}

        {/* ----- 1st side pot: efficiency ----- */}
        <div className="flex flex-col gap-0.5 px-0.5 pt-2.5">
          <span className="font-display font-bold uppercase text-[19px] text-ink">Most Efficient Player</span>
          <span className="text-[12.5px] text-ink-2">1st Side Pot · $30 · highest (goals + assists) ÷ minutes</span>
        </div>
        <PodiumCard title="⚡ EFFICIENCY LEADERS" tone="green" entries={effEntries} variant="player" valueClass="text-green-ink" />
        {effRows.slice(3, 8).map((p, i) => (
          <Card key={p.id} className="flex items-center gap-3 px-3.5 py-2.5">
            <span className="w-6 text-center text-ink-3 font-num font-bold text-[15px]">{i + 4}</span>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <PlayerName name={p.playerName} color={p.ownerColor} iconUrl={p.iconUrl} size={26} />
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-3">
                <span className="text-ink-3">picked by</span>
                <span
                  className="grid place-items-center shrink-0 rounded-pill text-white font-num font-bold border-[1.5px] border-white/70"
                  style={{ width: 17, height: 17, background: p.ownerColor, fontSize: 7 }}
                >
                  {monogram(p.you ? "You" : p.ownerName)}
                </span>
                <span className={"truncate font-bold " + (p.you ? "text-brand-ink" : "text-ink")}>{p.you ? "You" : p.ownerName}</span>
              </span>
            </div>
            <div className="text-right">
              <div className="font-num font-bold text-[15px] text-green-ink tabular-nums">{p.rate.toFixed(4)}</div>
              <div className="text-[10.5px] text-ink-3">{p.g}G+{p.a}A · {p.min}m</div>
            </div>
          </Card>
        ))}

        {/* ----- 2nd side pot: discipline (knockout only) ----- */}
        {combined && discRows && (
          <>
            <div className="flex flex-col gap-0.5 px-0.5 pt-2.5">
              <span className="font-display font-bold uppercase text-[19px] text-ink">Worst Discipline</span>
              <span className="text-[12.5px] text-ink-2">2nd Side Pot · $30 · most card points by your 3 teams · knockout only</span>
            </div>
            <PodiumCard title="🟥 DISCIPLINE LEADERS" tone="red" entries={discEntries} variant="user" valueClass="text-red-ink" />
            {discRows.slice(3, 8).map((p, i) => (
              <Card
                key={p.id}
                className={"flex items-center gap-3 px-3.5 py-[11px] " + (p.you ? "border-brand bg-brand-soft" : "")}
              >
                <span className="w-6 text-center text-ink-3 font-num font-bold text-[15px]">{i + 4}</span>
                <div className="flex-1 min-w-0">
                  <UserName name={p.name} color={p.color} avatarUrl={p.avatarUrl} you={p.you} />
                </div>
                <span className="font-num font-bold text-[20px] text-red-ink tabular-nums">
                  {p.cardPts}
                  <span className="text-[12px] text-ink-3 ml-0.5">cp</span>
                </span>
              </Card>
            ))}
          </>
        )}
      </Scroll>
    </>
  );
}
