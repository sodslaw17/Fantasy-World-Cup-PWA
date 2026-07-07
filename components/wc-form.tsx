"use client";
// ============================================================
// components/wc-form.tsx — form atoms for Login + Admin surfaces
// Inputs/Selects ≥48px; NumberStepper 46px. All token-mapped.
// ============================================================
import * as React from "react";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* Field — label + control + hint/error */
export function Field({
  label,
  hint,
  required,
  error,
  htmlFor,
  children,
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-[7px]">
      {label && (
        <span className="text-[13px] font-bold text-ink-2">
          {label}
          {required && <span className="text-red-ink ml-[3px]">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="text-xs font-medium text-ink-3">{hint}</span>}
      {error && <span className="text-xs font-semibold text-red-ink">{error}</span>}
    </label>
  );
}

/* Input — 48px (big: 54px). Focus = brand border + 3px brand-soft ring. */
export function Input({
  big,
  invalid,
  leftIcon,
  mono,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  big?: boolean;
  invalid?: boolean;
  leftIcon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="relative flex items-center">
      {leftIcon && (
        <span className="absolute left-3.5 grid place-items-center w-5 h-5 text-ink-3 pointer-events-none">
          {leftIcon}
        </span>
      )}
      <input
        className={cx(
          "w-full rounded-md bg-surface text-ink font-semibold outline-none",
          "border-[1.5px] transition-[border-color,box-shadow] duration-100",
          "focus:border-brand focus:[box-shadow:0_0_0_3px_var(--brand-soft)]",
          invalid ? "border-red" : "border-line-2",
          big ? "min-h-[54px] text-[17px]" : "min-h-12 text-[15.5px]",
          leftIcon ? "pl-[42px] pr-3.5" : "px-3.5",
          mono ? "font-num" : "font-body",
          className
        )}
        {...rest}
      />
    </div>
  );
}

/* Select — 48px, custom chevron */
export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative flex">
      <select
        className={cx(
          "appearance-none w-full min-h-12 pl-3.5 pr-[38px] rounded-md bg-surface text-ink",
          "border-[1.5px] border-line-2 font-body text-[15.5px] font-semibold outline-none cursor-pointer",
          "focus:border-brand focus:[box-shadow:0_0_0_3px_var(--brand-soft)]",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1.5 6 6.5 11 1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </div>
  );
}

/* NumberStepper — admin score/stat entry. 46px −/＋, tabular value. */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  width = 132,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  width?: number;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  const Step = ({ dir, sym }: { dir: number; sym: string }) => (
    <button
      type="button"
      aria-label={dir < 0 ? "decrease" : "increase"}
      onClick={() => set(value + dir)}
      className={cx(
        "grid place-items-center w-[46px] h-[46px] shrink-0 bg-paper-2 text-ink",
        "text-2xl font-bold leading-none select-none cursor-pointer",
        dir < 0 ? "border-r border-line" : "border-l border-line"
      )}
    >
      {sym}
    </button>
  );
  return (
    <div
      className="inline-flex items-center h-12 rounded-md border-[1.5px] border-line-2 overflow-hidden bg-surface"
      style={{ width }}
    >
      <Step dir={-1} sym="−" />
      <span className="flex-1 text-center font-num font-bold text-xl text-ink tabular-nums">{value}</span>
      <Step dir={1} sym="+" />
    </div>
  );
}

/* Toggle — 46×28 track, green when on */
export function Toggle({
  on,
  onChange,
  labels,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  labels?: [string, string];
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-[9px] bg-transparent border-0 cursor-pointer p-0"
    >
      <span className={cx("relative w-[46px] h-7 rounded-pill shrink-0 transition-colors", on ? "bg-green" : "bg-line-2")}>
        <span
          className="absolute top-[3px] w-[22px] h-[22px] rounded-pill bg-white shadow-sm transition-[left]"
          style={{ left: on ? 21 : 3 }}
        />
      </span>
      {labels && <span className="text-[13.5px] font-bold text-ink-2">{on ? labels[0] : labels[1]}</span>}
    </button>
  );
}

/* Avatar — monogram fallback + optional upload affordance (admin) */
export function Avatar({
  name,
  color = "var(--blue)",
  size = 40,
  uploadable,
  src,
}: {
  name: string;
  color?: string;
  size?: number;
  uploadable?: boolean;
  src?: string | null;
}) {
  const init = (name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="relative grid place-items-center shrink-0 rounded-pill text-white font-num font-bold border-[1.5px] border-white/70 shadow-sm overflow-hidden"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        init
      )}
      {uploadable && (
        <span className="absolute -right-0.5 -bottom-0.5 grid place-items-center w-4 h-4 rounded-pill bg-surface border border-line-2 text-ink-2">
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2v8M2 6h8" strokeLinecap="round" /></svg>
        </span>
      )}
    </span>
  );
}

/* SectionTitle — heading inside cards/pages (admin) */
export function SectionTitle({
  children,
  sub,
  right,
}: {
  children: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3.5">
      <div>
        <div className="font-display font-bold uppercase tracking-[.01em] text-[21px] text-ink leading-none">{children}</div>
        {sub && <div className="mt-[5px] text-[13px] font-medium text-ink-2 max-w-[540px]">{sub}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
