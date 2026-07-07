"use client";
// ============================================================
// app/brand-provider.tsx — PER-USER DRAFTED-COUNTRY THEMING (§11.3)
// ------------------------------------------------------------
// THE LOGIC, made concrete. Group / pre-draft / standby phases share
// the TRIONDA palette (host accent, default blue). The moment a user's
// knockout draft is recorded, the whole app re-skins to the flag
// colors of their FIRST drafted country.
//
//   1. read the user's picks, take the one with the LOWEST pick_number
//   2. feed that team's stored theme_primary_hex / theme_secondary_hex
//      into computeBrand(...)  ← runs the WCAG-AA contrast guardrail
//   3. set the returned --brand* vars as an inline style on the
//      app-root wrapper that contains every screen + the TabBar
//
// computeBrand already guarantees AA: --brand-ink (brand-as-text) and
// --brand-on (text-on-brand-fill) are nudged until they pass against
// the active surface. NEVER read a raw flag hex in a component — read
// the --brand* tokens. Never extract color from a flag image at runtime.
// ============================================================
import * as React from "react";
import { computeBrand, GROUP_ACCENTS, type Base } from "@/lib/theme";

export type Phase = "group" | "predraft" | "knockout";

export type DraftPick = {
  userId: string;
  pickNumber: number;            // drafts.pick_number — lower = earlier
  teamPrimaryHex: string;        // teams.theme_primary_hex
  teamSecondaryHex: string;      // teams.theme_secondary_hex
};

/* ------------------------------------------------------------
   resolveBrandVars — pure selection logic. Call this on the server
   (in the layout / a server component) where you already have the
   session user + phase, then pass the result down. Keeping it pure
   means no flash: the wrapper renders with the right vars on first paint.
------------------------------------------------------------ */
export function resolveBrandVars({
  phase,
  userId,
  picks,
  base,
  groupAccent = "blue",
}: {
  phase: Phase;
  userId: string;
  picks: DraftPick[];
  base: Base;
  groupAccent?: keyof typeof GROUP_ACCENTS;
}): React.CSSProperties {
  const firstPick =
    phase === "knockout"
      ? picks
          .filter((p) => p.userId === userId)
          .sort((a, b) => a.pickNumber - b.pickNumber)[0]
      : undefined;

  const vars = firstPick
    ? computeBrand(firstPick.teamPrimaryHex, firstPick.teamSecondaryHex, base)
    : computeBrand(...GROUP_ACCENTS[groupAccent], base);

  return vars as React.CSSProperties;
}

/* ------------------------------------------------------------
   BrandProvider — the app-root wrapper. Put EVERY user-facing screen
   and the TabBar inside it. `data-base` drives light/dark; the inline
   style carries the per-user --brand* override. Because globals.css
   uses `@theme inline`, every bg-brand / text-brand-ink / brandTinted
   utility downstream resolves to these values with zero prop drilling.
------------------------------------------------------------ */
export function BrandProvider({
  base,
  brandVars,
  children,
}: {
  base: Base;
  brandVars: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div data-base={base} style={brandVars} className="contents">
      {children}
    </div>
  );
}

// ── wiring (app/(app)/layout.tsx — server component) ───────────
// import { resolveBrandVars, BrandProvider } from "@/app/brand-provider";
//
// export default async function AppLayout({ children }) {
//   const { user, phase } = await getSession();          // your existing auth/phase
//   const picks = await getDraftPicks();                 // your existing query
//   const base = await getThemePreference();             // "light" | "dark"
//   const brandVars = resolveBrandVars({ phase, userId: user.id, picks, base });
//   return <BrandProvider base={base} brandVars={brandVars}>{children}</BrandProvider>;
// }
// ───────────────────────────────────────────────────────────────
