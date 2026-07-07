"use client";
// Ported from handoff/code/app/draft/standby-screen.tsx — PRE-DRAFT "Draft" tab.
// Live countdown + organiser message + draft position card + CTA to draft order.
import * as React from "react";
import { ScreenHeader, Scroll, Card, Banner } from "@/components/wc-ui";
import Link from "next/link";

function useCountdown(targetISO: string) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  let d = Math.max(0, new Date(targetISO).getTime() - now);
  const days = Math.floor(d / 864e5); d -= days * 864e5;
  const hrs = Math.floor(d / 36e5); d -= hrs * 36e5;
  const mins = Math.floor(d / 6e4); d -= mins * 6e4;
  const secs = Math.floor(d / 1e3);
  return { days, hrs, mins, secs };
}

function Unit({ v, l }: { v: number; l: string }) {
  return (
    <div className="text-center">
      <div className="font-num font-bold text-[34px] leading-none text-brand-on tabular-nums">
        {String(v).padStart(2, "0")}
      </div>
      <div className="mt-1 text-[10.5px] font-bold tracking-[.1em] text-brand-on/75">{l}</div>
    </div>
  );
}

export function StandbyScreen({
  draftAtISO,
  standbyBody,
  draftPosition,
  teamCount = 3,
  waveIntensity = 1,
}: {
  draftAtISO: string;
  standbyBody: string;
  draftPosition: number;
  teamCount?: number;
  waveIntensity?: number;
}) {
  const c = useCountdown(draftAtISO);
  return (
    <>
      <ScreenHeader title="Draft Standby" sub="Pre-draft · get ready" waveIntensity={waveIntensity} />
      <Scroll>
        {/* Hero countdown */}
        <div className="relative overflow-hidden rounded-lg bg-ink px-5 pt-[22px] pb-6 shadow-md">
          <svg viewBox="0 0 390 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-50">
            <path d="M0 70 Q97 40 195 70 T390 70 V120 H0 Z" fill="#0A3D91" />
            <path d="M0 84 Q97 54 195 84 T390 84 V120 H0 Z" fill="#008A52" />
            <path d="M0 98 Q97 68 195 98 T390 98 V120 H0 Z" fill="#E4002B" />
          </svg>
          <div className="relative">
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[.08em] text-gold-ink">
              ◆ Knockout kicks off in
            </div>
            <div className="flex justify-between max-w-[280px]">
              <Unit v={c.days} l="DAYS" />
              <Unit v={c.hrs} l="HRS" />
              <Unit v={c.mins} l="MIN" />
              <Unit v={c.secs} l="SEC" />
            </div>
          </div>
        </div>

        <Banner tone="brand" icon="📲">Watch your phone — the snake draft runs over SMS.</Banner>

        <Card className="px-[18px] py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏁</span>
            <h3 className="m-0 font-display font-bold uppercase text-[18px]">What happens next</h3>
          </div>
          <p className="m-0 text-ink-2 text-sm leading-[1.55]">{standbyBody}</p>
        </Card>

        {/* CTA → Draft Order page */}
        <Link
          href="/my-picks"
          className="flex items-center gap-3 w-full min-h-[50px] px-4 rounded-lg bg-brand text-brand-on text-left [-webkit-tap-highlight-color:transparent]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M9 3h6v3H9zM8.5 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="flex-1 min-w-0 leading-[1.15]">
            <span className="block font-extrabold text-sm">Set your draft order</span>
            <span className="block text-[11.5px] font-semibold opacity-85">Rank positions &amp; team wishlist before the draft</span>
          </span>
          <span className="shrink-0 text-xl font-bold">›</span>
        </Link>

        <Card tone="gold" className="flex items-center justify-between px-[18px] py-4">
          <div>
            <div className="text-[11.5px] font-bold uppercase tracking-[.06em] text-gold-ink">Your draft position</div>
            <div className="mt-1 text-ink-2 text-[13px]">Set by your group-stage rank</div>
          </div>
          <div className="font-num font-bold text-[38px] text-gold-ink">#{draftPosition}</div>
        </Card>

        <div className="text-ink-3 text-[12.5px] text-center px-2 py-0.5">
          You&apos;ll draft <b className="text-ink-2">{teamCount} teams</b> from the Round of 32.
        </div>
      </Scroll>
    </>
  );
}
