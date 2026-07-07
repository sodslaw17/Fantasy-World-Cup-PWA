"use client";

import React from "react";
import { Card } from "@/components/wc-ui";
import { Field as WcField, Input, Select, NumberStepper as WcNumberStepper } from "@/components/wc-form";

/* Re-export wc-form primitives for admin forms */
export { WcField as Field, Input as AdminInput, Select as AdminSelect };

/* ── FormBlock ─────────────────────────────────────────────────────────────
   260px left rail (title + desc) + right fields. Matches admin_shell.jsx.  */
export function FormBlock({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
        <div className="p-[20px_22px] border-b md:border-b-0 md:border-r border-line bg-paper-2">
          <div className="text-[15px] font-bold text-ink">{title}</div>
          {desc && (
            <div className="mt-1.5 text-[12.5px] font-medium text-ink-2 leading-[1.45]">{desc}</div>
          )}
        </div>
        <div className="p-[20px_22px] flex flex-col gap-[18px]">{children}</div>
      </div>
    </Card>
  );
}

/* ── NumberStepper ─────────────────────────────────────────────────────────
   Wraps wc-form NumberStepper; adds a hidden input for form submission.    */
export function NumberStepper({
  name,
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2" aria-label={label}>
      <input type="hidden" name={name} value={value} />
      <WcNumberStepper value={value} onChange={onChange} min={min} max={max} />
    </div>
  );
}

/* ── SaveBar ───────────────────────────────────────────────────────────────
   Sticky bottom bar: saved/unsaved indicator + Discard + Save.             */
export function SaveBar({
  isDirty,
  pending,
  onDiscard,
  saveLabel = "Save changes",
}: {
  isDirty: boolean;
  pending: boolean;
  onDiscard?: () => void;
  saveLabel?: string;
}) {
  if (!isDirty && !pending) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-[18px] py-3 bg-surface border border-line rounded-lg shadow-md">
      <span className="inline-flex items-center gap-2 text-[13px] font-bold text-gold-ink">
        <span className="w-2 h-2 rounded-pill bg-gold" aria-hidden="true" />
        Unsaved changes
      </span>
      <div className="flex gap-[10px]">
        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            disabled={pending}
            className="inline-flex items-center justify-center min-h-11 px-[18px] rounded-pill border-[1.5px] border-line-2 bg-transparent text-ink font-bold text-[13.5px] cursor-pointer disabled:opacity-50"
          >
            Discard
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center min-h-11 px-[18px] rounded-pill bg-brand text-brand-on font-bold text-[13.5px] border-0 cursor-pointer disabled:opacity-50"
        >
          {pending ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}

/* ── AdminButton ──────────────────────────────────────────────────────────
   Primary / secondary / danger action button, ≥48px height.               */
export function AdminButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: {
  variant?: "primary" | "secondary" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center justify-center gap-2 min-h-12 px-[18px] rounded-pill font-bold text-[13.5px] border-[1.5px] border-transparent cursor-pointer disabled:opacity-50 transition-transform active:scale-[.99]";
  const variants = {
    primary: "bg-brand text-brand-on shadow-sm",
    secondary: "bg-paper-2 text-ink border-line-2",
    danger: "bg-red-soft text-red-ink border-transparent",
  };
  return (
    <button type="button" {...props} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
