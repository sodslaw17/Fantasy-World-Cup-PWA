"use client";
import * as React from "react";
import { onColor } from "@/lib/theme";

export interface PreviewOption {
  code: string;
  primaryHex: string;
  secondaryHex: string;
}

export function ThemePreviewPanel({
  options,
  value,
  onChange,
}: {
  options: PreviewOption[];
  value: string | null;
  onChange: (code: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const active = options.find((o) => o.code === value) ?? null;

  return (
    <div ref={ref} className="fixed top-[calc(env(safe-area-inset-top,0px)+6px)] left-3 z-[51]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={active ? `Theme preview: ${active.code} — click to change` : "Admin theme preview"}
        className="w-9 h-9 rounded-full border border-line bg-surface/90 text-ink-3 shadow-sm flex items-center justify-center transition-colors backdrop-blur-sm"
        style={
          active
            ? { backgroundColor: active.primaryHex, borderColor: "transparent", color: onColor(active.primaryHex) }
            : undefined
        }
      >
        {active ? (
          <span className="text-[10px] font-bold font-num leading-none">{active.code}</span>
        ) : (
          <PaletteIcon />
        )}
      </button>

      {open && (
        <div className="absolute top-10 left-0 bg-surface border border-line rounded-lg shadow-lg overflow-hidden w-[175px]">
          <div className="px-3 py-2 text-[10.5px] font-bold text-ink-3 uppercase tracking-wider border-b border-line">
            Theme Preview
          </div>
          <div className="p-1">
            <PickerRow
              label="Off / My team"
              color={null}
              active={value === null}
              onClick={() => { onChange(null); setOpen(false); }}
            />
            {options.map((opt) => (
              <PickerRow
                key={opt.code}
                label={opt.code}
                color={opt.primaryHex}
                active={value === opt.code}
                onClick={() => { onChange(opt.code); setOpen(false); }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PickerRow({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-md text-[13px] font-semibold text-ink transition-colors text-left min-h-[36px]"
      style={active ? { backgroundColor: "var(--brand-soft)", color: "var(--brand-ink)" } : undefined}
    >
      <span
        className="w-3.5 h-3.5 rounded-full shrink-0 border border-line-2"
        style={{ backgroundColor: color ?? "var(--paper-3)" }}
      />
      {label}
      {active && (
        <span className="ml-auto opacity-80">
          <CheckIcon />
        </span>
      )}
    </button>
  );
}

function PaletteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 2a10 10 0 0 1 8.4 15.4c-.9 1.3-2.3 1.6-3.9 1.6h-1a2 2 0 0 0-2 2 2 2 0 0 1-2 2 10 10 0 0 1-9.5-13.3A10 10 0 0 1 12 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
