"use client";
// ============================================================
// components/wc-ui.tsx — TRIONDA shared component library
// ------------------------------------------------------------
// RENDERED CODE. Match this markup; do not paraphrase it. Every
// color/radius/shadow/font resolves through a token utility from
// globals.css — there are NO hard-coded hex values except where a
// value is genuinely data-driven (a user's monogram color, a flag
// fill), in which case it arrives as a prop and is applied inline.
//
// Tap-target floor (SPEC §11.6): every interactive control is ≥44×44.
// Steppers use 48×48; bottom-tab buttons min-h-11 (44); primary
// buttons min-h-12 (48).
// ============================================================
import * as React from "react";
import { onColor } from "@/lib/theme";

// tiny class joiner (or import your project's `cn`)
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* ============================================================
   BUTTON  —  pill, min-h-12 (48), weight 700, 16px
   kinds: primary | secondary | ghost | gold | danger
   gold is WINNER/PAYOUT ONLY. Press feedback: translateY(1px) scale(.99)
   ============================================================ */
type BtnKind = "primary" | "secondary" | "ghost" | "gold" | "danger";

const BTN_KIND: Record<BtnKind, string> = {
  primary: "bg-brand text-brand-on shadow-sm",
  secondary: "bg-brand-soft text-brand-ink",
  ghost: "bg-transparent text-ink border-line-2",
  gold: "text-[#3A2D07] shadow-gold bg-[linear-gradient(180deg,#D8B868,var(--gold))]",
  danger: "bg-red text-white",
};

export function Btn({
  kind = "primary",
  full,
  disabled,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: BtnKind; full?: boolean }) {
  return (
    <button
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 min-h-12 px-[22px] rounded-pill",
        "font-body font-bold text-base border-[1.5px] border-transparent",
        "transition-transform duration-75 active:translate-y-px active:scale-[.99]",
        "[-webkit-tap-highlight-color:transparent] disabled:opacity-55 disabled:pointer-events-none",
        full && "w-full",
        BTN_KIND[kind],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ============================================================
   CARD  —  surface, 1px line, rounded-lg (22), shadow-sm
   tones: gold (gold-soft/gold-line) · brand (brand-soft)
   ============================================================ */
export function Card({
  tone,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { tone?: "gold" | "brand" | "muted" }) {
  const tones = {
    gold: "bg-gold-soft border-gold-line",
    brand: "bg-brand-soft border-transparent",
    muted: "bg-paper-2 border-line",
  } as const;
  return (
    <div
      className={cx(
        "bg-surface border border-line rounded-lg shadow-sm",
        tone && tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ============================================================
   PILL  —  status chip, 11.5px / 700, rounded-pill
   colors: ink | brand | gold | green | red | blue
   ============================================================ */
type PillColor = "ink" | "brand" | "gold" | "green" | "red" | "blue";
const PILL_COLOR: Record<PillColor, string> = {
  ink: "bg-paper-3 text-ink-2",
  brand: "bg-brand-soft text-brand-ink",
  gold: "bg-gold-soft text-gold-ink",
  green: "bg-green-soft text-green-ink",
  red: "bg-red-soft text-red-ink",
  blue: "bg-blue-soft text-blue-ink",
};
export function Pill({
  color = "ink",
  className,
  children,
}: {
  color?: PillColor;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 px-[11px] py-1 rounded-pill",
        "text-[11.5px] font-bold tracking-[.02em] leading-[1.3]",
        PILL_COLOR[color],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ============================================================
   PTS BADGE  —  +3 good · +2 gold-ink · +0/+1 ink-3  (tabular)
   ============================================================ */
export function PtsBadge({ value }: { value: number }) {
  const tone = value === 3 ? "text-good" : value === 2 ? "text-gold-ink" : "text-ink-3";
  return (
    <span className={cx("font-num font-bold text-[15px] tabular-nums", tone)}>
      {value > 0 ? "+" + value : "+0"}
    </span>
  );
}

/* ============================================================
   STEPPER  —  the frequent +/- score input (SPEC §11.6)
   48×48 +/- buttons; press tints green (inc) / red (dec).
   Center value 50px tall, font-num 32px tabular. Clamp 0–20.
   ============================================================ */
export function Stepper({
  value,
  onChange,
  locked,
}: {
  value: number;
  onChange: (v: number) => void;
  locked?: boolean;
}) {
  const press = (dir: number) => {
    if (!locked) onChange(Math.max(0, Math.min(20, value + dir)));
  };
  const Btnn = ({ dir, sym }: { dir: number; sym: string }) => (
    <button
      type="button"
      disabled={locked}
      onClick={() => press(dir)}
      aria-label={dir < 0 ? "decrease" : "increase"}
      className={cx(
        "grid place-items-center size-12 rounded-md border-[1.5px] border-line-2 bg-surface",
        "text-2xl font-bold leading-none select-none transition-transform duration-75",
        "[-webkit-tap-highlight-color:transparent] active:scale-90",
        locked ? "text-ink-3 cursor-default" : "text-ink cursor-pointer",
        !locked &&
          (dir < 0
            ? "active:bg-red-soft active:border-red"
            : "active:bg-green-soft active:border-green")
      )}
    >
      {sym}
    </button>
  );
  return (
    <span className="inline-flex items-center gap-2">
      <Btnn dir={-1} sym="−" />
      <span
        className={cx(
          "grid place-items-center min-w-[50px] h-[50px] rounded-md font-num font-bold text-[32px] tabular-nums",
          locked ? "bg-paper-3 text-ink" : "bg-ink text-white"
        )}
      >
        {value}
      </span>
      <Btnn dir={1} sym="+" />
    </span>
  );
}

/* ============================================================
   WAVE STRIP  —  the three-wave "tri-onda" motif.
   intensity 0..1; ≤0.01 collapses to a 1px hairline.
   brandTinted swaps the host trio for --brand/--brand-2.
   ============================================================ */
export function WaveStrip({
  intensity = 1,
  brandTinted = false,
  height = 26,
}: {
  intensity?: number;
  brandTinted?: boolean;
  height?: number;
}) {
  if (intensity <= 0.01) return <div className="h-px bg-line" />;
  const o = intensity;
  const c1 = brandTinted ? "var(--brand)" : "#0A3D91";
  const c2 = brandTinted ? "var(--brand-2)" : "#008A52";
  const c3 = brandTinted ? "var(--brand)" : "#E4002B";
  return (
    <svg viewBox="0 0 390 26" preserveAspectRatio="none" className="block w-full" style={{ height }}>
      <path d="M0 13 Q97 1 195 13 T390 13" fill="none" stroke={c1} strokeWidth="2.5" opacity={0.85 * o} />
      <path d="M0 17 Q97 5 195 17 T390 17" fill="none" stroke={c2} strokeWidth="2.5" opacity={0.7 * o} />
      <path d="M0 21 Q97 9 195 21 T390 21" fill="none" stroke={c3} strokeWidth="2.5" opacity={0.7 * o} />
    </svg>
  );
}

/* ============================================================
   SCREEN HEADER  —  surface header, safe-area aware.
   eyebrow `sub` + UPPERCASE font-display title + optional right slot,
   ends with a WaveStrip. title 28px (big variant 34px).
   ============================================================ */
export function ScreenHeader({
  title,
  sub,
  right,
  waveIntensity = 1,
  brandTinted = false,
  big,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  waveIntensity?: number;
  brandTinted?: boolean;
  big?: boolean;
}) {
  return (
    <div className="bg-surface pt-[calc(env(safe-area-inset-top)+8px)]">
      <div className="flex items-end justify-between gap-3 px-5 pt-2.5 pb-3">
        <div className="min-w-0">
          {sub && (
            <div className="text-ink-2 text-[13px] font-semibold mb-0.5 truncate">{sub}</div>
          )}
          <h1
            className={cx(
              "m-0 font-display font-bold uppercase tracking-[.005em] leading-none text-ink",
              big ? "text-[34px]" : "text-[28px]"
            )}
          >
            {title}
          </h1>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <WaveStrip intensity={waveIntensity} brandTinted={brandTinted} />
    </div>
  );
}

/* ============================================================
   BANNER  —  inline notice row. tones: red | gold | brand | green
   ============================================================ */
export function Banner({
  tone = "red",
  icon,
  children,
}: {
  tone?: "red" | "gold" | "brand" | "green";
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const map = {
    red: "bg-red-soft border-red text-red-ink",
    gold: "bg-gold-soft border-gold-line text-gold-ink",
    brand: "bg-brand-soft border-transparent text-brand-ink",
    green: "bg-green-soft border-transparent text-green-ink",
  } as const;
  return (
    <div
      className={cx(
        "flex items-center gap-2.5 px-3.5 py-3 rounded-md border text-sm font-semibold",
        map[tone]
      )}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

/* ============================================================
   SCROLL  —  flex-column scroll body. Pair with `.wc-scroll`
   global rule (globals.css) so fixed-height children never shrink.
   ============================================================ */
export function Scroll({ children, pad = 14 }: { children: React.ReactNode; pad?: number }) {
  return (
    <div
      className="wc-scroll flex-1 overflow-y-auto flex flex-col gap-3 [-webkit-overflow-scrolling:touch]"
      style={{ padding: `12px ${pad}px calc(env(safe-area-inset-bottom) + 18px)` }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   NAME + ICON ATOMS (SPEC §11.4)
   A name ALWAYS carries its icon, everywhere it appears.
   Production renders the admin-uploaded asset; the monogram /
   geometric crest shown here is the graceful fallback.
   ============================================================ */

// UserName — round avatar (avatar_url when uploaded; monogram fallback
// on the user's accent color) + name. Optional " · You" suffix.
export function UserName({
  name,
  color = "#565D6E",
  avatarUrl,
  size = 28,
  bold = true,
  you = false,
  dim = false,
}: {
  name: string;
  color?: string;
  avatarUrl?: string | null;
  size?: number;
  bold?: boolean;
  you?: boolean;
  dim?: boolean;
}) {
  const init = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={cx(
        "inline-flex items-center gap-[9px] min-w-0",
        bold ? "font-bold" : "font-semibold",
        dim ? "text-ink-2" : "text-ink"
      )}
    >
      <span
        className="grid place-items-center shrink-0 rounded-pill text-white font-num font-bold shadow-sm border-[1.5px] border-white/70 overflow-hidden"
        style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          init
        )}
      </span>
      <span className="truncate">
        {name}
        {you && <span className="text-brand-ink font-extrabold"> · You</span>}
      </span>
    </span>
  );
}

// PlayerName — squircle icon (rounded-[9px]; footballer icon_url or
// monogram) + player name. For the efficiency side-pot pick.
export function PlayerName({
  name,
  color = "#14151A",
  iconUrl,
  size = 28,
}: {
  name: string;
  color?: string;
  iconUrl?: string | null;
  size?: number;
}) {
  const init = name
    .replace(/^[A-Z]\.\s*/, "")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex items-center gap-[9px] min-w-0 font-bold text-ink">
      <span
        className="grid place-items-center shrink-0 rounded-[9px] text-white font-num font-bold shadow-sm overflow-hidden"
        style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      >
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          init
        )}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

// CountryLogo — shield/crest filled with the team's theme color, FIFA
// code centered in onColor(themeColor). Admin logo_url renders here in
// production; this geometric crest is the fallback.
export function CountryLogo({
  code,
  themeColor = "#8A90A0",
  logoUrl,
  size = 30,
}: {
  code: string;
  themeColor?: string;
  logoUrl?: string | null;
  size?: number;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={code} className="object-contain shrink-0" style={{ width: size, height: size }} />
    );
  }
  const fg = onColor(themeColor);
  return (
    <span className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 44" className="absolute inset-0 w-full h-full [filter:drop-shadow(0_1px_2px_rgba(20,21,26,.12))]">
        <path d="M20 1 L37 7 V22 C37 33 29 40 20 43 C11 40 3 33 3 22 V7 Z" fill={themeColor} stroke="#fff" strokeWidth="2" />
      </svg>
      <span
        className="relative font-num font-bold tracking-[.01em]"
        style={{ color: fg, fontSize: size * 0.3, paddingBottom: size * 0.06 }}
      >
        {code}
      </span>
    </span>
  );
}

// CountryName — country logo (crest) OR flag chip + name.
// `flag` swaps the crest for a flag chip; `abbrev` shows the 3-letter code.
export function CountryName({
  code,
  name,
  themeColor,
  logoUrl,
  flagSlot,
  size = 26,
  bold = true,
  dim = false,
  abbrev = false,
  flag = false,
  reverse = false,
}: {
  code: string;
  name: string;
  themeColor?: string;
  logoUrl?: string | null;
  flagSlot?: React.ReactNode; // <Flag/> or <img> of the flag
  size?: number;
  bold?: boolean;
  dim?: boolean;
  abbrev?: boolean;
  flag?: boolean;
  reverse?: boolean;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-[9px] min-w-0",
        reverse && "flex-row-reverse",
        bold ? "font-bold" : "font-semibold",
        dim ? "text-ink-2" : "text-ink"
      )}
    >
      {flag ? (
        <span
          className="shrink-0 rounded-[5px] overflow-hidden border border-line-2 shadow-sm"
          style={{ width: size * 1.36, height: size }}
        >
          {flagSlot}
        </span>
      ) : (
        <CountryLogo code={code} themeColor={themeColor} logoUrl={logoUrl} size={size + 4} />
      )}
      <span className="truncate">{abbrev ? code : name}</span>
    </span>
  );
}

// CountryStacked — knockout variant: crest with an admin custom icon
// stacked at the bottom-right (white-ringed lozenge), + name.
// `big` uses a 50px crest + 22px uppercase display name.
export function CountryStacked({
  code,
  name,
  themeColor,
  logoUrl,
  customIconUrl,
  size = 34,
  label = true,
  big = false,
}: {
  code: string;
  name: string;
  themeColor?: string;
  logoUrl?: string | null;
  customIconUrl?: string | null;
  size?: number;
  label?: boolean;
  big?: boolean;
}) {
  const crest = big ? 50 : size;
  return (
    <span className="inline-flex items-center gap-[11px] font-bold text-ink">
      <span className="relative shrink-0">
        <CountryLogo code={code} themeColor={themeColor} logoUrl={logoUrl} size={crest} />
        {customIconUrl && (
          <span
            className="absolute -right-1 -bottom-1 grid place-items-center rounded-pill bg-surface border-2 border-white shadow-sm overflow-hidden"
            style={{ width: crest * 0.5, height: crest * 0.5 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={customIconUrl} alt="" className="w-full h-full object-cover" />
          </span>
        )}
      </span>
      {label && (
        <span className={cx(big && "font-display text-[22px] uppercase tracking-[.01em]", !big && "text-base")}>
          {name}
        </span>
      )}
    </span>
  );
}

/* ============================================================
   PODIUM  —  reusable top-3. Rendered order 2-1-3.
   #1 tallest bar (74px) + biggest avatar (56px).
   variant "user" = round avatars · "player" = squircles.
   ============================================================ */
type PodiumEntry = {
  place: 1 | 2 | 3;
  initials: string;
  name: string;
  value: React.ReactNode;
  color: string;
  sub?: string;
  owner?: { initials: string; name: string; color: string };
};
const POD_COL: Record<number, string> = { 1: "#E9C45A", 2: "#C8CCD4", 3: "#D8A06A" };
const BAR_H: Record<number, number> = { 1: 74, 2: 52, 3: 38 };

export function Podium({
  entries,
  variant = "user",
  valueClass = "text-gold-ink",
}: {
  entries: PodiumEntry[];
  variant?: "user" | "player";
  valueClass?: string;
}) {
  const order = [
    entries.find((e) => e.place === 2),
    entries.find((e) => e.place === 1),
    entries.find((e) => e.place === 3),
  ].filter(Boolean) as PodiumEntry[];
  const radius = variant === "player" ? "rounded-[11px]" : "rounded-pill";
  return (
    <div className="flex items-end gap-2">
      {order.map((e) => {
        const top = e.place === 1;
        const av = top ? 56 : 46;
        return (
          <div key={e.place} className="grid justify-items-center gap-1.5 flex-1 min-w-0">
            <div
              className={cx("grid place-items-center text-white font-num font-bold shadow-md", radius, top ? "text-[18px]" : "text-[15px]")}
              style={{ width: av, height: av, background: e.color, border: `3px solid ${POD_COL[e.place]}` }}
            >
              {e.initials}
            </div>
            <div className="font-bold text-[12.5px] text-center leading-[1.12] w-full truncate">{e.name}</div>
            {e.owner && (
              <div className="inline-flex items-center gap-1 max-w-full -mt-px text-[10.5px] font-semibold text-ink-2 overflow-hidden">
                <span
                  className="grid place-items-center shrink-0 rounded-pill text-white font-num font-bold border-[1.5px] border-white/70"
                  style={{ width: 15, height: 15, background: e.owner.color, fontSize: 7 }}
                >
                  {e.owner.initials}
                </span>
                <span className="truncate">{e.owner.name}</span>
              </div>
            )}
            {e.sub && <div className="text-[10.5px] text-ink-3 -mt-[3px]">{e.sub}</div>}
            <div className={cx("font-num font-bold text-base", valueClass)}>{e.value}</div>
            <div
              className="w-[82%] grid place-items-start justify-center pt-[5px] font-num font-bold text-white text-[18px] rounded-t-[9px]"
              style={{ height: BAR_H[e.place], background: `linear-gradient(180deg, ${POD_COL[e.place]}, ${POD_COL[e.place]}AA)` }}
            >
              {e.place}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   TAB BAR  —  bottom nav. Each icon carries a host color
   (blue/green/red cycled); the SELECTED tab turns GOLD inside a
   soft gold lozenge, label → gold-ink weight 800.
   Buttons min-w-14 (56) / min-h-11 (44).
   ============================================================ */
export type TabId = string;
export type Tab = { id: TabId; label: string; icon: keyof typeof TAB_ICONS };

export const TAB_ICONS = {
  standings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9a6 6 0 0012 0V3H6z" /><path d="M6 5H3v2a3 3 0 003 3M18 5h3v2a3 3 0 01-3 3M9 21h6M12 15v6" strokeLinecap="round" /></svg>
  ),
  today: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" /></svg>
  ),
  predict: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 4l2.4 4.8L20 9.3l-3.7 3.5.9 5.2L12 15.6 6.8 18l.9-5.2L4 9.3l5.6-.5z" fill="currentColor" stroke="none" /></svg>
  ),
  myteam: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" strokeLinecap="round" /></svg>
  ),
  draft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" /></svg>
  ),
  payouts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8z" /><path d="M8.5 8a3.5 3.5 0 017 0" strokeLinecap="round" /><path d="M12 12v4M10 14h4" strokeLinecap="round" /></svg>
  ),
  rules: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z" /><path d="M8 20a3 3 0 01-3-3M9 8h6M9 12h6" strokeLinecap="round" /></svg>
  ),
  bracket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h5v5H3M3 14h5v5H3M8 7.5h5v9h5M16 12h3" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
};

const TAB_HOST: Record<string, string> = {
  standings: "var(--blue)", today: "var(--green)", predict: "var(--red)",
  myteam: "var(--green)", draft: "var(--green)", bracket: "var(--red)",
  payouts: "var(--blue)", rules: "var(--green)",
};

export function TabBar({
  tabs,
  active,
  onSelect,
}: {
  tabs: Tab[];
  active: TabId | null;
  onSelect: (id: TabId) => void;
}) {
  return (
    <div className="bg-surface border-t border-line flex justify-around pt-2 [box-shadow:0_-4px_18px_rgba(20,21,26,.05)] pb-[calc(env(safe-area-inset-bottom)+6px)]">
      {tabs.map((t) => {
        const on = t.id === active;
        const host = TAB_HOST[t.icon] || "var(--blue)";
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className="grid justify-items-center gap-1 px-1 py-0.5 flex-1 min-w-14 min-h-11 [-webkit-tap-highlight-color:transparent]"
          >
            <span
              className={cx(
                "grid place-items-center w-[38px] h-7 rounded-pill transition-colors",
                on
                  ? "bg-[linear-gradient(180deg,var(--gold-soft),#F0E2BC)] [box-shadow:inset_0_0_0_1px_var(--gold-line)]"
                  : "bg-transparent"
              )}
            >
              <span className="block w-[23px] h-[23px]" style={{ color: on ? "#9A7A24" : host, opacity: on ? 1 : 0.9 }}>
                {TAB_ICONS[t.icon]}
              </span>
            </span>
            <span className={cx("text-[10.5px] whitespace-nowrap", on ? "font-extrabold text-gold-ink" : "font-semibold text-ink-3")}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
