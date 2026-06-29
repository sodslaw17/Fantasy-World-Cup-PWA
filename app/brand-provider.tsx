"use client";
// Per-user drafted-country theming (§11.3). Ported from handoff/code/app/brand-provider.tsx.
// Watches html[data-base] via MutationObserver so brand vars stay correct when user
// toggles dark/light mode (ThemeManager owns data-base on <html>; we just observe it).
import * as React from "react";
import { resolveBrandVars, type BrandPhase, type DraftPickInfo } from "@/lib/brand";
import { computeBrand, type Base } from "@/lib/theme";
import { ThemePreviewPanel, type PreviewOption } from "@/components/admin/ThemePreviewPanel";
import { FlagBackdrop } from "@/components/ui/FlagBackdrop";
import { getFlagUrl } from "@/lib/team-colors";

export type { BrandPhase, DraftPickInfo };

export function BrandProvider({
  phase,
  profileId,
  picks,
  isAdmin = false,
  children,
}: {
  phase: BrandPhase;
  profileId: string | null;
  picks: DraftPickInfo[];
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const [base, setBase] = React.useState<Base>("light");
  const [previewCode, setPreviewCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    const update = () =>
      setBase(
        document.documentElement.dataset.base === "dark" ? "dark" : "light"
      );
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributeFilter: ["data-base"] });
    return () => obs.disconnect();
  }, []);

  // Distinct first picks per profile, deduped by team code — for the admin preview list.
  const previewOptions = React.useMemo<PreviewOption[]>(() => {
    if (!isAdmin) return [];
    const byProfile = new Map<string, DraftPickInfo>();
    for (const p of picks) {
      const cur = byProfile.get(p.profileId);
      if (!cur || p.pickNumber < cur.pickNumber) byProfile.set(p.profileId, p);
    }
    const seen = new Set<string>();
    const result: PreviewOption[] = [];
    for (const p of byProfile.values()) {
      const code = p.code ?? "";
      if (!code || seen.has(code)) continue;
      seen.add(code);
      result.push({ code, primaryHex: p.primaryHex, secondaryHex: p.secondaryHex });
    }
    return result.sort((a, b) => a.code.localeCompare(b.code));
  }, [isAdmin, picks]);

  // Resolve the effective team code: preview override takes precedence, then the
  // real user's first pick (knockout phase only, matching resolveBrandVars logic).
  const effectiveCode = React.useMemo<string | null>(() => {
    if (previewCode) return previewCode;
    if (phase !== "knockout" || !profileId) return null;
    const first = picks
      .filter((p) => p.profileId === profileId)
      .sort((a, b) => a.pickNumber - b.pickNumber)[0];
    return first?.code ?? null;
  }, [previewCode, phase, profileId, picks]);

  const flagUrl = effectiveCode ? getFlagUrl(effectiveCode) : null;

  // Resolve logo URL for light-mode backdrop: prefer the effective pick's custom_icon_url.
  const logoUrl = React.useMemo<string | null>(() => {
    if (!effectiveCode) return null;
    const match = picks.find((p) => p.code === effectiveCode);
    return match?.logoUrl ?? null;
  }, [effectiveCode, picks]);

  // When preview is active, bypass resolveBrandVars and drive computeBrand directly.
  let vars: React.CSSProperties;
  if (previewCode) {
    const opt = previewOptions.find((o) => o.code === previewCode);
    vars = opt
      ? (computeBrand(opt.primaryHex, opt.secondaryHex, base) as React.CSSProperties)
      : (resolveBrandVars({ phase, profileId, picks, base }) as React.CSSProperties);
  } else {
    vars = resolveBrandVars({ phase, profileId, picks, base }) as React.CSSProperties;
  }

  return (
    <div style={vars} className="contents">
      <FlagBackdrop darkUrl={flagUrl} lightUrl={logoUrl} base={base} />
      {children}
      {isAdmin && previewOptions.length > 0 && (
        <ThemePreviewPanel
          options={previewOptions}
          value={previewCode}
          onChange={setPreviewCode}
        />
      )}
    </div>
  );
}
