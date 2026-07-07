"use client";
// ============================================================
// app/(app)/my-team/my-team-screen.tsx — KNOCKOUT "My Team" tab
// ------------------------------------------------------------
// Worked port of the prototype's MyTeamScreen
// (reference/prototype-src/app/screens_knockout.jsx) to token
// utilities. Knockout-only tab: the viewer's 3 drafted teams,
// the FIRST pick that drives the per-user theme (§11.3), and
// their 1st-side-pot footballer.
//
// This file is MARKUP. Data is abstracted behind props — wire it
// to your real drafts / standings / side-pot queries. The screen
// renders inside the app-root wrapper that already sets the
// --brand* tokens from the first team (see app/brand-provider.tsx),
// so `brandTinted`, bg-brand-soft, text-brand-ink here all resolve
// to that team's AA-safe colors automatically.
// ============================================================
import * as React from "react";
import {
  ScreenHeader, Scroll, Card, Pill, CountryStacked, CountryLogo, PlayerName,
} from "@/components/wc-ui";

export type DraftedTeam = {
  code: string;        // FIFA code, e.g. "BRA"
  name: string;        // "Brazil"
  themeColor?: string; // teams.theme_primary_hex (crest fill / fallback)
  logoUrl?: string | null;
  customIconUrl?: string | null;
  pts: number;         // knockout points for this team
  gd: string;          // goal differential, pre-formatted ("+3" / "−1")
  note?: string;       // "Won R32 · 3 goals"
};

export type Efficiency = { name: string; iconUrl?: string | null; g: number; a: number; min: number };

export function MyTeamScreen({
  userName,
  teams,
  efficiency,
  waveIntensity = 1,
}: {
  userName: string;
  teams: DraftedTeam[];     // ordered by pick_number (teams[0] = first pick)
  efficiency: Efficiency;
  waveIntensity?: number;
}) {
  const first = teams[0];
  const effRate = (efficiency.g + efficiency.a) / efficiency.min;

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
        {/* FIRST PICK — the team that drives this user's app theme (§11.3) */}
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

        {/* the 3 drafted teams */}
        <div className="text-[12px] font-bold uppercase tracking-[.05em] text-ink-2 mx-1 -mb-0.5">
          Your 3 drafted teams
        </div>
        {teams.map((t, i) => (
          <Card key={t.code} className="flex items-center gap-3 px-3.5 py-3">
            <span className="w-[18px] font-num font-bold text-[13px] text-ink-3">{i + 1}</span>
            <CountryStacked
              code={t.code}
              name={t.name}
              themeColor={t.themeColor}
              logoUrl={t.logoUrl}
              customIconUrl={t.customIconUrl}
            />
            <div className="flex-1" />
            <div className="text-right">
              <div className="font-num font-bold text-[20px] tabular-nums">
                {t.pts}
                <span className="text-[12px] text-ink-3 ml-0.5">pts</span>
              </div>
              <div className="text-[11.5px] text-ink-3">GD {t.gd}</div>
            </div>
          </Card>
        ))}

        {/* 1st side pot — efficiency footballer */}
        <div className="text-[12px] font-bold uppercase tracking-[.05em] text-ink-2 mx-1 mt-2 -mb-0.5">
          1st Side Pot — your footballer
        </div>
        <Card className="flex items-center gap-3 px-4 py-3.5">
          <PlayerName name={efficiency.name} iconUrl={efficiency.iconUrl} size={38} />
          <div className="flex-1" />
          <div className="text-right">
            <div className="font-num font-bold text-[18px] text-green-ink tabular-nums">{effRate.toFixed(4)}</div>
            <div className="text-[11px] text-ink-3">
              {efficiency.g}G + {efficiency.a}A / {efficiency.min}m
            </div>
          </div>
        </Card>
      </Scroll>
    </>
  );
}
