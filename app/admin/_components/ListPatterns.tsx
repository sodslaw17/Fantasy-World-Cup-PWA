import React from "react";
import { Card } from "@/components/wc-ui";

/* ── Table ─────────────────────────────────────────────────────────────────
   grid-template-columns approach matching admin_shell.jsx.                 */
export function Table({
  columns,
  children,
  minWidth,
}: {
  columns: { label: string; w: string; align?: "left" | "right" | "center" }[];
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div
        className="grid items-center gap-3.5 px-[18px] py-3 bg-paper-2 border-b border-line"
        style={{ gridTemplateColumns: columns.map((c) => c.w).join(" "), minWidth }}
      >
        {columns.map((c, i) => (
          <span
            key={i}
            className="text-[11px] font-extrabold tracking-[.06em] uppercase text-ink-3"
            style={{ textAlign: c.align || "left" }}
          >
            {c.label}
          </span>
        ))}
      </div>
      <div>{children}</div>
    </Card>
  );
}

/* ── Row ───────────────────────────────────────────────────────────────── */
export function Row({
  columns,
  cells,
  last,
}: {
  columns: { w: string; align?: "left" | "right" | "center" }[];
  cells: React.ReactNode[];
  last?: boolean;
}) {
  return (
    <div
      className="grid items-center gap-3.5 px-[18px] py-3"
      style={{
        gridTemplateColumns: columns.map((c) => c.w).join(" "),
        borderBottom: last ? "none" : "1px solid var(--line)",
      }}
    >
      {cells.map((cell, i) => (
        <div key={i} style={{ textAlign: columns[i]?.align || "left", minWidth: 0 }}>
          {cell}
        </div>
      ))}
    </div>
  );
}

/* ── RowAction ─────────────────────────────────────────────────────────────
   Inline text-button style row action. Meets tap target via padding.       */
export function RowAction({
  onClick,
  danger,
  children,
  disabled,
  icon,
}: {
  onClick?: () => void;
  danger?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-[5px] min-h-9 px-[10px] rounded-lg bg-transparent border border-transparent font-bold text-[13px] cursor-pointer disabled:opacity-40"
      style={{ color: danger ? "var(--red-ink)" : "var(--ink-2)", fontFamily: "var(--font-body)" }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ── Status ────────────────────────────────────────────────────────────────
   Dot + label for record status.                                           */
type StatusKind = "active" | "invited" | "locked" | "pending";

const STATUS_MAP: Record<StatusKind, [string, string, string]> = {
  active:  ["var(--green)",  "Active",  "var(--green-ink)"],
  invited: ["var(--gold)",   "Invited", "var(--gold-ink)"],
  locked:  ["var(--ink-3)", "Locked",  "var(--ink-2)"],
  pending: ["var(--ink-3)", "Pending", "var(--ink-2)"],
};

export function Status({
  variant,
  label,
}: {
  variant: StatusKind;
  label?: string;
}) {
  const [dot, defaultLabel, color] = STATUS_MAP[variant] || STATUS_MAP.active;
  return (
    <span className="inline-flex items-center gap-[7px] text-[12.5px] font-bold" style={{ color }}>
      <span className="w-2 h-2 rounded-pill shrink-0" style={{ background: dot }} aria-hidden="true" />
      {label ?? defaultLabel}
    </span>
  );
}

/* ── EmptyState ─────────────────────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-0">
      <div className="flex flex-col items-center text-center py-[52px] px-[26px] pb-[56px]">
        <span className="grid place-items-center w-16 h-16 rounded-[18px] bg-paper-2 border border-line text-ink-3 mb-4">
          {icon || (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="M3 10h18M8 15h5" strokeLinecap="round" />
            </svg>
          )}
        </span>
        <div className="font-display font-bold uppercase text-[20px] text-ink">{title}</div>
        {description && (
          <div className="mt-[7px] text-[13.5px] font-medium text-ink-2 max-w-[360px] leading-[1.45]">{description}</div>
        )}
        {action && <div className="mt-[18px]">{action}</div>}
      </div>
    </Card>
  );
}

/* ── SectionCard ───────────────────────────────────────────────────────── */
export function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      {children}
    </Card>
  );
}

/* ── AlertBanner ───────────────────────────────────────────────────────── */
export function AlertBanner({
  variant = "info",
  children,
}: {
  variant?: "info" | "warning" | "danger" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    info:    "bg-blue-soft border-blue text-blue-ink",
    warning: "bg-gold-soft border-gold-line text-gold-ink",
    danger:  "bg-red-soft border-red text-red-ink",
    success: "bg-green-soft border-green text-green-ink",
  };
  return (
    <div className={`rounded-md border px-3.5 py-3 text-sm font-semibold ${styles[variant]}`}>
      {children}
    </div>
  );
}

/* ── AvatarMonogram ─────────────────────────────────────────────────────── */
export function AvatarMonogram({
  src,
  name,
  size = 32,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="rounded-pill object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="rounded-pill bg-blue-soft text-blue-ink font-bold grid place-items-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}
