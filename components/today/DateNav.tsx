"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { shiftDateStr } from "@/lib/date-window";

const SWIPE_THRESHOLD_PX = 50;

export function DateNav({
  selected,
  today,
  min,
  max,
  label,
}: {
  selected: string;
  today: string;
  min: string;
  max: string;
  label: string;
}) {
  const router = useRouter();
  const touchStartX = React.useRef<number | null>(null);

  const canPrev = selected > min;
  const canNext = selected < max;
  const isToday = selected === today;

  function go(dateStr: string) {
    if (dateStr < min || dateStr > max) return;
    router.push(dateStr === today ? "/today" : `/today?d=${dateStr}`);
  }

  function shift(days: number) {
    go(shiftDateStr(selected, days));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx > SWIPE_THRESHOLD_PX) shift(-1);
    else if (dx < -SWIPE_THRESHOLD_PX) shift(1);
  }

  return (
    <div className="flex flex-col gap-1 pb-2.5">
      {!isToday && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => go(today)}
            className="shrink-0 text-[11px] font-semibold text-brand-ink bg-brand-soft rounded-full px-2.5 py-1 min-h-[28px]"
          >
            ← Go back to Today
          </button>
        </div>
      )}

      <div
        className="flex items-center justify-between gap-1 px-2.5"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => shift(-1)}
          disabled={!canPrev}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-ink-2 text-xl disabled:opacity-30 active:bg-paper-2"
        >
          ‹
        </button>

        <span className="flex-1 min-w-0 text-center text-[13px] font-semibold text-ink truncate">
          {label}
        </span>

        <button
          type="button"
          aria-label="Next day"
          onClick={() => shift(1)}
          disabled={!canNext}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-ink-2 text-xl disabled:opacity-30 active:bg-paper-2"
        >
          ›
        </button>
      </div>
    </div>
  );
}
