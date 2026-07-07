"use client";

import { useEffect, useRef, useState } from "react";
import { setMapping, removeMapping, triggerManualEspnSync, espnSearchTeams } from "@/app/admin/sync/actions";

export interface EspnTeamRow {
  id: string;
  fifaCode: string;
  name: string;
  espnId: string | null;
  mappingId: string | null;
}

export interface EspnLogEntry {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  trigger: string;
  status: string;
  inLiveWindow: boolean;
  skipped: boolean;
  matchesChecked: number;
  matchesUpdated: number;
  statsUpdated: number;
  apiRequests: number;
  unmappedTeams: string[];
  errors: string[];
}

export function EspnTab({ teams, log }: { teams: EspnTeamRow[]; log: EspnLogEntry[] }) {
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [searchError, setSearchError] = useState("");
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [autoPoll, setAutoPoll] = useState(false);
  const [intervalSec, setIntervalSec] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleSync() {
    setSyncing(true);
    const { result, error } = await triggerManualEspnSync();
    setSyncing(false);
    if (error) {
      setLastResult(`Error: ${error}`);
    } else if (result) {
      setLastResult(
        result.skipped
          ? "Skipped (not in a live window)"
          : `Done: ${result.matchesUpdated} matches, ${result.statsUpdated} stat rows. ${result.apiRequests} ESPN requests. Errors: ${result.errors.length}`
      );
    }
  }

  // Client-driven polling — Vercel Cron on the Hobby plan only fires once a
  // day, so this is what actually delivers ~60s-cadence updates while this
  // tab is open and a match is live. Stops cleanly on unmount/toggle-off.
  useEffect(() => {
    if (autoPoll) {
      timerRef.current = setInterval(handleSync, Math.max(15, intervalSec) * 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPoll, intervalSec]);

  async function handleSearch() {
    setSearching(true);
    setSearchError("");
    const { teams: results, error } = await espnSearchTeams(searchQ);
    setSearching(false);
    if (error) { setSearchError(error); return; }
    setSearchResults(results ?? []);
  }

  async function handleSave(teamId: string) {
    const val = draftValues[teamId] ?? "";
    if (!val) return;
    setPendingIds((p) => ({ ...p, [teamId]: true }));
    const { error } = await setMapping("team", teamId, val, "espn");
    setPendingIds((p) => ({ ...p, [teamId]: false }));
    setMessages((m) => ({ ...m, [teamId]: error ?? "Saved" }));
    setTimeout(() => setMessages((m) => ({ ...m, [teamId]: "" })), 3000);
  }

  async function handleRemove(mappingId: string, teamId: string) {
    setPendingIds((p) => ({ ...p, [teamId]: true }));
    await removeMapping(mappingId);
    setPendingIds((p) => ({ ...p, [teamId]: false }));
  }

  const latest = log[0];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-paper-2 border border-line p-4 space-y-3">
        <p className="text-xs text-ink-2">
          ESPN&rsquo;s free public scoreboard — unofficial, no key, best-effort. Feeds
          the same auto/manual system as API-Football: manual entries always win, and
          a failed or down feed just logs an error below and leaves existing scores
          untouched.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg bg-brand text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Force ESPN sync now"}
          </button>
          <label className="flex items-center gap-1.5 text-xs text-ink-2">
            <input
              type="checkbox"
              checked={autoPoll}
              onChange={(e) => setAutoPoll(e.target.checked)}
            />
            Auto-poll every
          </label>
          <input
            type="number"
            min={15}
            value={intervalSec}
            onChange={(e) => setIntervalSec(parseInt(e.target.value) || 60)}
            className="w-16 rounded-lg bg-paper-2 border border-line-2 px-2 py-1 text-xs text-center text-ink"
          />
          <span className="text-xs text-ink-2">sec (while this tab stays open)</span>
        </div>
        {lastResult && <p className="text-xs text-ink-2">{lastResult}</p>}
      </div>

      {latest && (
        <div className="rounded-xl bg-paper-2 border border-line p-4 space-y-2">
          <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide">Last ESPN sync</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={latest.status} />
            <span className="text-sm">{fmt(latest.startedAt)}</span>
            <span className="text-xs text-ink-3">({latest.trigger})</span>
          </div>
          {!latest.skipped && (
            <div className="grid grid-cols-3 gap-2 text-xs text-ink-2 pt-1">
              <Stat label="Matches" value={latest.matchesUpdated} />
              <Stat label="Stats"   value={latest.statsUpdated}   />
              <Stat label="Requests" value={latest.apiRequests}   />
            </div>
          )}
          {latest.unmappedTeams.length > 0 && (
            <p className="text-xs text-amber-600">Unmapped teams: {latest.unmappedTeams.join(", ")}</p>
          )}
          {latest.errors.length > 0 && (
            <div className="rounded bg-accent-red/10 px-3 py-2">
              {latest.errors.map((e, i) => (
                <p key={i} className="text-xs text-accent-red">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {log.length > 1 && (
        <div className="rounded-xl bg-paper-2 border border-line divide-y divide-line">
          {log.slice(1).map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
              <StatusBadge status={entry.status} />
              <span className="text-xs text-ink-2 flex-1">{fmt(entry.startedAt)}</span>
              <span className="text-xs text-ink-3">{entry.trigger}</span>
              {!entry.skipped && <span className="text-xs text-ink-3">{entry.apiRequests} req</span>}
              {entry.skipped && <span className="text-xs text-ink-3">skipped</span>}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs text-ink-2">
          Map each team to its ESPN team ID. Unmapped teams are skipped &mdash; never
          guessed &mdash; and show up under &ldquo;Unmapped teams&rdquo; above.
        </p>

        <div className="flex gap-2">
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Filter ESPN teams (e.g. Spain)"
            className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="rounded-lg bg-paper-2 border border-line px-4 py-2 text-sm font-medium text-ink-2 disabled:opacity-50"
          >
            {searching ? "…" : "Search"}
          </button>
        </div>

        {searchError && <p className="text-xs text-accent-red">{searchError}</p>}

        {searchResults.length > 0 && (
          <div className="rounded-xl bg-paper-2 border border-line divide-y divide-line max-h-64 overflow-y-auto">
            {searchResults.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-sm">{r.name}</span>
                <span className="text-xs font-mono text-brand">ID: {r.id}</span>
                <button
                  onClick={() => {
                    const match = teams.find(
                      (t) => t.name.toLowerCase() === r.name.toLowerCase()
                    );
                    if (match) setDraftValues((d) => ({ ...d, [match.id]: r.id }));
                  }}
                  className="text-xs text-brand underline"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-paper-2 border border-line divide-y divide-line">
          {teams.map((team) => {
            const msg = messages[team.id];
            return (
              <div key={team.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs font-mono text-ink-3 w-10 shrink-0">{team.fifaCode}</span>
                <span className="flex-1 text-sm min-w-0 truncate">{team.name}</span>
                {team.espnId ? (
                  <>
                    <span className="text-xs font-mono text-accent-green">#{team.espnId}</span>
                    <button
                      onClick={() => team.mappingId && handleRemove(team.mappingId, team.id)}
                      disabled={pendingIds[team.id]}
                      className="text-xs text-ink-3 hover:text-accent-red disabled:opacity-50"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      value={draftValues[team.id] ?? ""}
                      onChange={(e) => setDraftValues((d) => ({ ...d, [team.id]: e.target.value }))}
                      placeholder="ESPN ID"
                      className="w-24 rounded-lg bg-paper-2 border border-line-2 px-2 py-1 text-xs font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <button
                      onClick={() => handleSave(team.id)}
                      disabled={pendingIds[team.id] || !draftValues[team.id]}
                      className="rounded-lg bg-brand text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50"
                    >
                      {pendingIds[team.id] ? "…" : "Set"}
                    </button>
                    {msg && <span className={`text-xs ${msg === "Saved" ? "text-accent-green" : "text-accent-red"}`}>{msg}</span>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ok:      "bg-accent-green/20 text-accent-green",
    error:   "bg-accent-red/20 text-accent-red",
    skipped: "bg-paper-3 text-ink-3",
    running: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${styles[status] ?? styles.skipped}`}>
      {status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-semibold text-ink">{value}</p>
      <p className="text-ink-3">{label}</p>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}
