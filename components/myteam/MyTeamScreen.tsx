"use client";
// Ported from handoff/code/app/my-team/my-team-screen.tsx — KNOCKOUT "My Team" tab.
import * as React from "react";
import { ScreenHeader, Scroll, Card, Pill, CountryStacked, CountryLogo, PlayerName } from "@/components/wc-ui";
import { formatPer90 } from "@/lib/format";

export type DraftedTeam = {
  code: string;
  name: string;
  themeColor?: string;
  logoUrl?: string | null;
  customIconUrl?: string | null;
  pts: number;
  gd: string;
  cardPts: number;
  eliminated?: boolean;
  note?: string;
};

export type Efficiency = { name: string; iconUrl?: string | null; g: number; a: number; min: number };

export function MyTeamScreen({
  userName,
  teams,
  efficiency,
  effEliminated = false,
  waveIntensity = 1,
}: {
  userName: string;
  teams: DraftedTeam[];
  efficiency: Efficiency;
  effEliminated?: boolean;
  waveIntensity?: number;
}) {
  const first = teams[0];
  const effRate = efficiency.min > 0 ? (efficiency.g + efficiency.a) / efficiency.min : 0;

  return (
    <>
      <ScreenHeader
        title="My Team"
        sub={`${userName} · knockout`}
        waveIntensity={waveIntensity}
        brandTinted
        right={<Pill color="brand">★ themed</Pill>}
      />
      <Scroll>
        {/* First pick drives per-user theme */}
        {first && (
          <Card className="flex items-center gap-3 px-4 py-3.5 bg-brand-soft border-transparent">
            <CountryLogo code={first.code} themeColor={first.themeColor} logoUrl={first.logoUrl} size={42} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold tracking-[.03em] text-brand-ink">
                FIRST PICK — DRIVES YOUR THEME
              </div>
              <div className="mt-0.5 font-display font-bold uppercase text-[20px] leading-none truncate">
                {first.name}
              </div>
            </div>
          </Card>
        )}

        <div className="text-[12px] font-bold uppercase tracking-[.05em] text-ink-2 mx-1 -mb-0.5">
          Your 3 drafted teams
        </div>
        {teams.length === 0 && (
          <Card className="px-4 py-5 text-center">
            <p className="text-sm text-ink-2 font-semibold">No teams assigned yet</p>
            <p className="text-xs text-ink-3 mt-1">An admin will assign your draft picks shortly.</p>
          </Card>
        )}
        {teams.map((t, i) => (
          <Card key={t.code} className={"flex items-center gap-3 px-3.5 py-3" + (t.eliminated ? " opacity-55" : "")}>
            <span className="w-[18px] font-num font-bold text-[13px] text-ink-3">{i + 1}</span>
            <div className="flex-1 min-w-0 flex items-center gap-[11px]">
              <CountryStacked
                code={t.code}
                name={t.name}
                themeColor={t.themeColor}
                logoUrl={t.logoUrl}
                customIconUrl={t.customIconUrl}
                label={false}
              />
              <div className="min-w-0">
                <div className={"font-bold text-base truncate" + (t.eliminated ? " line-through text-ink-3" : " text-ink")}>{t.name}</div>
                {t.eliminated && <div className="text-[10px] font-bold text-accent-red leading-none mt-0.5">Eliminated</div>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-num font-bold text-[20px] tabular-nums">
                {t.pts}
                <span className="text-[12px] text-ink-3 ml-0.5">pts</span>
              </div>
              <div className="text-[11.5px] text-ink-3">GD {t.gd}</div>
            </div>
          </Card>
        ))}

        <div className="text-[12px] font-bold uppercase tracking-[.05em] text-ink-2 mx-1 mt-2 -mb-0.5">
          1st Side Pot — your footballer
        </div>
        <Card className={"flex items-center gap-3 px-4 py-3.5" + (effEliminated ? " opacity-55" : "")}>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <PlayerName name={efficiency.name || "Not yet entered"} iconUrl={efficiency.iconUrl} size={38} />
            {effEliminated && <span className="text-[10px] font-bold text-accent-red">Team eliminated</span>}
          </div>
          <div className="text-right shrink-0">
            <div className="font-num font-bold text-[18px] text-green-ink tabular-nums">
              {efficiency.min > 0 ? formatPer90(effRate) : "—"}
            </div>
            <div className="text-[11px] text-ink-3">
              {efficiency.g}G + {efficiency.a}A / {efficiency.min}m · per 90
            </div>
          </div>
        </Card>

        <div className="text-[12px] font-bold uppercase tracking-[.05em] text-ink-2 mx-1 mt-2 -mb-0.5">
          2nd Side Pot — Worst Discipline
        </div>
        <div className="text-[11px] text-ink-3 mx-1 -mt-0.5 mb-0.5">
          Y=1pt · 2Y=2pts · Red=4pts · most total card pts wins
        </div>
        {teams.length === 0 ? (
          <Card className="px-4 py-3 text-center">
            <p className="text-xs text-ink-3 italic">No teams assigned yet.</p>
          </Card>
        ) : (
          teams.map((t) => (
            <Card key={`disc-${t.code}`} className="flex items-center gap-3 px-3.5 py-3">
              <CountryLogo code={t.code} logoUrl={t.logoUrl} size={28} />
              <div className="flex-1 min-w-0 truncate text-sm font-semibold text-ink">{t.name}</div>
              <div className="text-right">
                <div className="font-num font-bold text-[20px] text-red-ink tabular-nums">
                  {t.cardPts}
                  <span className="text-[12px] text-ink-3 ml-0.5">cp</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </Scroll>
    </>
  );
}
