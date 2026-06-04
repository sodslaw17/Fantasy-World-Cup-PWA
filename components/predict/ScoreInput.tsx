"use client";

/** +/- score stepper — mobile-friendly alternative to a raw number input. */
export function ScoreInput({
  value,
  disabled,
  onChange,
}: {
  value: number | null;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  const current = value ?? 0;

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, current - 1))}
        disabled={disabled || current <= 0}
        className="w-10 h-12 rounded-l-lg bg-ink-soft border border-paper/20 text-paper/60 text-xl font-bold flex items-center justify-center active:bg-paper/10 disabled:opacity-30 select-none"
        aria-label="Decrease"
      >
        −
      </button>
      <div className="w-10 h-12 bg-ink border-y border-paper/20 flex items-center justify-center text-lg font-bold text-paper tabular-nums select-none">
        {value === null ? <span className="text-paper/30">?</span> : current}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(99, current + 1))}
        disabled={disabled}
        className="w-10 h-12 rounded-r-lg bg-ink-soft border border-paper/20 text-paper/60 text-xl font-bold flex items-center justify-center active:bg-paper/10 disabled:opacity-30 select-none"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
