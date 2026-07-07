// ============================================================
// lib/theme.ts — WCAG AA contrast guardrail + per-user theming
// ------------------------------------------------------------
// Framework-agnostic pure functions. Port EXACTLY — these are the
// reason a pale flag (Argentina sky-blue) or a near-black flag
// (Germany) both stay legible. SPEC §11.3 / §11.5.
//
// RULE OF THUMB:
//   --brand      may be the raw flag color (fills, active states)
//   --brand-ink  is brand used as TEXT on a surface (AA-guaranteed)
//   --brand-on   is text/icon that sits ON a --brand fill
// Anything that renders TEXT uses --brand-ink or --brand-on, never --brand.
// ============================================================

export type RGB = [number, number, number];
export type Base = "light" | "dark";

export interface BrandVars {
  "--brand": string;
  "--brand-ink": string;
  "--brand-on": string;
  "--brand-soft": string;
  "--brand-2": string;
  "--brand-2-ink": string;
}

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

// WCAG relative luminance
export function relLum([r, g, b]: RGB): number {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [R, G, B] = [f(r), f(g), f(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrast(a: string, b: string): number {
  const l1 = relLum(hexToRgb(a));
  const l2 = relLum(hexToRgb(b));
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// darken (factor<1) toward black, or lighten (factor>1) toward white
export function scale(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (factor < 1) return rgbToHex(r * factor, g * factor, b * factor);
  const t = factor - 1;
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}

// Nudge `hex` until it hits `ratio` against `bg`
// (darken if bg is light, lighten if bg is dark).
export function ensureContrast(hex: string, bg = "#FFFFFF", ratio = 4.5): string {
  if (contrast(hex, bg) >= ratio) return hex;
  const bgLight = relLum(hexToRgb(bg)) > 0.4;
  let out = hex;
  for (let i = 0; i < 24; i++) {
    out = scale(out, bgLight ? 0.92 : 1.08);
    if (contrast(out, bg) >= ratio) break;
  }
  return out;
}

// Pick the legible text color (ink or white) to sit on top of `fill`.
export function onColor(fill: string): string {
  return contrast("#14151A", fill) >= contrast("#FFFFFF", fill) ? "#14151A" : "#FFFFFF";
}

// Linear rgb blend; t = amount of b mixed into a (0..1).
export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

// Build the full AA-safe --brand token set from a flag's two stored
// colors (teams.theme_primary_hex / theme_secondary_hex) for the active base.
// Set the result as an inline style on the app-root wrapper.
export function computeBrand(primary: string, secondary: string, base: Base): BrandVars {
  const surface = base === "dark" ? "#16181F" : "#FFFFFF";
  return {
    "--brand": primary,
    "--brand-ink": ensureContrast(primary, surface, 4.5),
    "--brand-on": onColor(primary),
    "--brand-soft": mixHex(primary, surface, base === "dark" ? 0.82 : 0.88),
    "--brand-2": secondary,
    "--brand-2-ink": ensureContrast(secondary, surface, 4.5),
  };
}

// Group / pre-draft / standby phases share the TRIONDA palette.
// default accent = host blue; red/green offered as alternates.
export const GROUP_ACCENTS: Record<string, [string, string]> = {
  blue: ["#0A3D91", "#E4002B"],
  red: ["#E4002B", "#0A3D91"],
  green: ["#008A52", "#0A3D91"],
};

// ── usage (app-root wrapper) ───────────────────────────────
// const brandVars =
//   phase === "knockout" && user.firstTeam
//     ? computeBrand(user.firstTeam.theme_primary_hex, user.firstTeam.theme_secondary_hex, base)
//     : computeBrand(...GROUP_ACCENTS[groupAccent], base);
//
// return (
//   <div data-base={base} style={brandVars as React.CSSProperties}>
//     {children}
//   </div>
// );
// ───────────────────────────────────────────────────────────
