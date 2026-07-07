"use client";
// Ported from handoff/code/app/standings/standings-screen.tsx — PODIUM leaderboards.
// Presentation only. Pass already-sorted rows from the server query.
import * as React from "react";
import { ScreenHeader, Scroll, Card, Pill, Podium, UserName, PlayerName, CountryName } from "@/components/wc-ui";
import Link from "next/link";
import { formatPer90 } from "@/lib/format";

type Variant = "user" | "player";

function PodiumCard({
  title,
  tone,
  entries,
  variant,
  valueClass,
  teamsSection,
}: {
  title: string;
  tone: "gold" | "green" | "red";
  entries: React.ComponentProps<typeof Podium>["entries"];
  variant: Variant;
  valueClass: string;
  teamsSection?: React.ReactNode;
}) {
  const toneMap = {
    gold:  "bg-gold-soft border-gold-line text-gold-ink",
    green: "bg-green-soft border-transparent text-green-ink",
    red:   "bg-red-soft border-transparent text-red-ink",
  } as const;
  return (
    <Card className={"px-3.5 pt-4 pb-3.5 overflow-hidden " + toneMap[tone]}>
      <div className="text-center text-[11px] font-bold tracking-[.08em] mb-3.5">{title}</div>
      <Podium entries={entries} variant={variant} valueClass={valueClass} />
      {teamsSection && (
        <div className="mt-3.5 pt-3 border-t border-current/20 space-y-2">
          {teamsSection}
        </div>
      )}
    </Card>
  );
}

export type TeamChip = { code: string; name: string; logoUrl?: string | null; pts?: number; eliminated?: boolean };
export type StandingRow = { id: string; name: string; color: string; avatarUrl?: string | null; you?: boolean; value: number; teams?: TeamChip[] };
export type EffRow = {
  id: string; playerName: string; iconUrl?: string | null;
  ownerName: string; ownerColor: string; you?: boolean;
  rate: number; g: number; a: number; min: number;
  teamEliminated?: boolean;
};
export type DiscRow = { id: string; name: string; color: string; avatarUrl?: string | null; you?: boolean; cardPts: number; teams?: TeamChip[] };

const monogram = (s: string) => s.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const MEDALS = ["🥇", "🥈", "🥉"];

function TeamsRow({ teams, showPts = false }: { teams: TeamChip[]; showPts?: boolean }) {
  if (!teams.length) return null;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
      {teams.map((t) => (
        <span key={t.code} className={"inline-flex items-center gap-1 text-[11.5px] " + (t.eliminated ? "opacity-50 text-ink-3" : "text-ink-2")}>
          <CountryName code={t.code} name={t.name} logoUrl={t.logoUrl} size={14} bold={false} dim abbrev strikethrough={t.eliminated} />
          {showPts && t.pts !== undefined && (
            <span className="font-num tabular-nums text-ink-3">{t.pts}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function PodiumTeamsSection({ rows }: { rows: Array<{ id: string; name: string; teams?: TeamChip[]; pts?: number; ptsLabel?: string }> }) {
  return (
    <>
      {rows.map((r, i) => (
        <div key={r.id} className="space-y-0.5">
          <div className="text-[11px] font-bold opacity-70">{MEDALS[i]} {r.name}</div>
          {r.teams && r.teams.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 pl-4">
              {r.teams.map((t) => (
                <span key={t.code} className={"inline-flex items-center gap-1 text-[11.5px] " + (t.eliminated ? "opacity-50" : "")}>
                  <CountryName code={t.code} name={t.name} logoUrl={t.logoUrl} size={14} bold={false} dim strikethrough={t.eliminated} />
                  {t.pts !== undefined && (
                    <span className="font-num tabular-nums text-[11px] opacity-60">
                      {t.pts}{r.ptsLabel ? ` ${r.ptsLabel}` : ""}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export function StandingsScreen({
  playerCount,
  combined = false,
  pointsRows,
  effRows,
  discRows,
  isAdmin = false,
  waveIntensity = 1,
}: {
  playerCount: number;
  combined?: boolean;
  pointsRows: StandingRow[];
  effRows: EffRow[];
  discRows?: DiscRow[];
  isAdmin?: boolean;
  waveIntensity?: number;
}) {
  const ptsEntries = pointsRows.slice(0, 3).map((p, i) => ({
    place: (i + 1) as 1 | 2 | 3,
    initials: monogram(p.name),
    name: p.name.split(" ")[0],
    value: p.value,
    color: p.color,
    iconUrl: p.avatarUrl,
  }));
  const effEntries = effRows.slice(0, 3).map((p, i) => ({
    place: (i + 1) as 1 | 2 | 3,
    initials: monogram(p.playerName.replace(/^[A-Z]\.\s*/, "")),
    name: p.playerName,
    value: formatPer90(p.rate),
    color: p.ownerColor,
    iconUrl: p.iconUrl,
    sub: `${p.g}G+${p.a}A`,
    owner: { initials: monogram(p.you ? "You" : p.ownerName), name: p.you ? "You" : p.ownerName.split(" ")[0], color: p.ownerColor },
  }));
  const discEntries = (discRows || []).slice(0, 3).map((p, i) => ({
    place: (i + 1) as 1 | 2 | 3,
    initials: monogram(p.name),
    name: p.name.split(" ")[0],
    value: p.cardPts,
    color: p.color,
    iconUrl: p.avatarUrl,
  }));

  return (
    <>
      <ScreenHeader
        title="Standings"
        sub={combined ? "Overall · group + knockout" : "Group stage"}
        waveIntensity={waveIntensity}
        right={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin">
                <Pill color="ink">Admin</Pill>
              </Link>
            )}
            <Pill color="ink">{playerCount} players</Pill>
          </div>
        }
      />
      <Scroll>
        {/* Overall points */}
        {ptsEntries.length > 0 && (
          <PodiumCard
            title="🏆 OVERALL LEADERS"
            tone="gold"
            entries={ptsEntries}
            variant="user"
            valueClass="text-gold-ink"
            teamsSection={
              pointsRows.slice(0, 3).some((p) => p.teams?.length) ? (
                <PodiumTeamsSection
                  rows={pointsRows.slice(0, 3).map((p) => ({ id: p.id, name: p.name, teams: p.teams, ptsLabel: "kp" }))}
                />
              ) : undefined
            }
          />
        )}
        {pointsRows.slice(3).map((p, i) => (
          <Card
            key={p.id}
            className={"flex items-start gap-3 px-3.5 py-3 " + (p.you ? "border-brand bg-brand-soft" : "")}
          >
            <span className="w-6 text-center text-ink-3 font-num font-bold text-[15px] pt-0.5 shrink-0">{i + 4}</span>
            <div className="flex-1 min-w-0">
              <UserName name={p.name} color={p.color} avatarUrl={p.avatarUrl} you={p.you} />
              {p.teams && <TeamsRow teams={p.teams} showPts />}
            </div>
            <span className="font-num font-bold text-[20px] tabular-nums shrink-0">
              {p.value}
              <span className="text-[12px] text-ink-3 ml-0.5">pts</span>
            </span>
          </Card>
        ))}

        {/* Draft preferences link — group phase only */}
        {!combined && (
          <Link
            href="/my-picks"
            className="flex items-center justify-between gap-3 bg-brand-soft border border-brand/30 rounded-lg px-4 py-3 no-underline"
          >
            <div>
              <div className="text-[13px] font-bold text-brand-ink">Draft Preferences</div>
              <div className="text-[11.5px] text-ink-3">Submit your team wishlist before the draft</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-brand-ink">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}

        {/* 1st side pot: efficiency */}
        <div className="flex flex-col gap-0.5 px-0.5 pt-2.5">
          <span className="font-display font-bold uppercase text-[19px] text-ink">Most Efficient Player</span>
          <span className="text-[12.5px] text-ink-2">1st Side Pot · $30 · highest (goals + assists) per 90 min</span>
        </div>
        {effEntries.length > 0 ? (
          <PodiumCard title="⚡ EFFICIENCY LEADERS" tone="green" entries={effEntries} variant="player" valueClass="text-green-ink" />
        ) : (
          <Card className="px-4 py-3">
            <p className="text-xs text-ink-3 italic text-center">Stats not yet entered — admin updates after the tournament.</p>
          </Card>
        )}
        {effRows.slice(3).map((p, i) => (
          <Card key={p.id} className={"flex items-center gap-3 px-3.5 py-2.5" + (p.teamEliminated ? " opacity-55" : "")}>
            <span className="w-6 text-center text-ink-3 font-num font-bold text-[15px]">{i + 4}</span>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <PlayerName name={p.playerName} color={p.ownerColor} iconUrl={p.iconUrl} size={26} />
              {p.teamEliminated && <span className="text-[10px] font-bold text-accent-red -mt-0.5">Team eliminated</span>}
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
              <div className="font-num font-bold text-[15px] text-green-ink tabular-nums">{formatPer90(p.rate)}</div>
              <div className="text-[10.5px] text-ink-3">{p.g}G+{p.a}A · {p.min}m · per 90</div>
            </div>
          </Card>
        ))}

        {/* 2nd side pot: discipline (knockout only) */}
        {combined && discRows && (
          <>
            <div className="flex flex-col gap-0.5 px-0.5 pt-2.5">
              <span className="font-display font-bold uppercase text-[19px] text-ink">Worst Discipline</span>
              <span className="text-[12.5px] text-ink-2">2nd Side Pot · $30 · most card points by your 3 teams</span>
            </div>
            {discEntries.length > 0 && (
              <PodiumCard
                title="🟥 DISCIPLINE LEADERS"
                tone="red"
                entries={discEntries}
                variant="user"
                valueClass="text-red-ink"
                teamsSection={
                  discRows.slice(0, 3).some((p) => p.teams?.length) ? (
                    <PodiumTeamsSection
                      rows={discRows.slice(0, 3).map((p) => ({ id: p.id, name: p.name, teams: p.teams, ptsLabel: "cp" }))}
                    />
                  ) : undefined
                }
              />
            )}
            {discRows.slice(3).map((p, i) => (
              <Card
                key={p.id}
                className={"flex items-start gap-3 px-3.5 py-3 " + (p.you ? "border-brand bg-brand-soft" : "")}
              >
                <span className="w-6 text-center text-ink-3 font-num font-bold text-[15px] pt-0.5 shrink-0">{i + 4}</span>
                <div className="flex-1 min-w-0">
                  <UserName name={p.name} color={p.color} avatarUrl={p.avatarUrl} you={p.you} />
                  {p.teams && <TeamsRow teams={p.teams} showPts />}
                </div>
                <span className="font-num font-bold text-[20px] text-red-ink tabular-nums shrink-0">
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
