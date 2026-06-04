"use client";

import { useState } from "react";
import { loadDemoData, clearDemoData } from "@/app/admin/settings/demo-actions";

export function DemoDataControls() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState<"load" | "clear" | null>(null);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  async function handle(action: "load" | "clear") {
    if (!confirm(
      action === "load"
        ? "This will create 10 demo users, enter match results, and set the phase to 'knockout'. Existing match results will be overwritten. Continue?"
        : "This will delete all demo users and reset all match results, stats, and draft data. Continue?"
    )) return;

    setRunning(action);
    setLog([]);
    setResult(null);

    const fn = action === "load" ? loadDemoData : clearDemoData;
    const res = await fn();
    setLog(res.log);
    setResult(res.error ? "error" : "success");
    if (res.error) setLog((l) => [...l, `Error: ${res.error}`]);
    setRunning(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-accent-red/10 border border-accent-red/30 px-4 py-3 text-xs text-accent-red space-y-1">
        <p className="font-semibold">⚠ Development/preview use only</p>
        <p>Loading demo data overwrites match results and creates fake user accounts. Clear it before inviting real players.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => handle("load")}
          disabled={running !== null}
          className="rounded-lg bg-gold text-ink text-sm font-semibold px-5 py-2.5 min-h-tap disabled:opacity-50"
        >
          {running === "load" ? "Loading… (takes ~15s)" : "🎮 Load demo data"}
        </button>
        <button
          onClick={() => handle("clear")}
          disabled={running !== null}
          className="rounded-lg border border-accent-red/40 text-accent-red text-sm font-semibold px-5 py-2.5 min-h-tap disabled:opacity-50 hover:bg-accent-red/10"
        >
          {running === "clear" ? "Clearing…" : "🗑 Clear demo data"}
        </button>
      </div>

      {/* Log output */}
      {log.length > 0 && (
        <div className={`rounded-xl border px-4 py-3 space-y-0.5 text-xs font-mono ${
          result === "error"
            ? "bg-accent-red/10 border-accent-red/30 text-accent-red"
            : "bg-accent-green/10 border-accent-green/30 text-accent-green"
        }`}>
          {log.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {result === "success" && log.length > 0 && (
        <div className="text-xs text-paper/50 space-y-1">
          <p>Switch between phase views using <strong>Phase Override</strong> above:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li><strong>groups</strong> — leaderboard with predictions &amp; results</li>
            <li><strong>draft_standby</strong> — standby screen with draft preferences</li>
            <li><strong>knockout</strong> — bracket, overall leaderboard, efficiency</li>
          </ul>
        </div>
      )}
    </div>
  );
}
