"use client";

import { useEffect, useState } from "react";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function DeadlineStatus({
  deadline,
  isLockedServer,
}: {
  deadline: string | null;
  isLockedServer: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const update = () => setTimeLeft(new Date(deadline).getTime() - Date.now());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const locked = isLockedServer || (timeLeft !== null && timeLeft <= 0);

  if (!deadline) return null;

  if (locked) {
    return (
      <div className="flex items-center gap-2 bg-red-soft border border-red-ink/30 text-red-ink rounded-xl px-4 py-3 text-sm font-medium">
        <span>🔒</span>
        <span>Predictions are locked — the deadline has passed.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-gold-soft border border-gold-line rounded-xl px-4 py-3">
      <div>
        <p className="text-xs text-ink-3 uppercase tracking-wide">Predictions close in</p>
        <p className="font-num text-lg font-bold text-gold-ink tabular-nums">
          {timeLeft !== null ? formatCountdown(timeLeft) : "…"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-ink-3">Deadline</p>
        <p className="text-xs text-ink">
          {new Date(deadline).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          })}
        </p>
      </div>
    </div>
  );
}
