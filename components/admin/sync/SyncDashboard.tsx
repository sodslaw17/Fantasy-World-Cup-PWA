"use client";

import { useState, useTransition } from "react";
import {
  setMapping, removeMapping, triggerManualSync,
  apiSearchTeams, apiSearchPlayers,
} from "@/app/admin/sync/actions";
import { EspnTab, type EspnTeamRow, type EspnLogEntry } from "./EspnTab";

// ── Types passed from server page ────────────────────────────────────────────

export interface TeamRow {
  id: string;
  fifaCode: string;
  name: string;
  apiId: string | null;
  mappingId: string | null;
}

export interface PlayerRow {
  pickId: string;
  displayName: string;
  playerName: string;
  teamCode: string | null;
  apiId: string | null;
  mappingId: string | null;
  lastSyncedAt: string | null;
}

export interface SyncLogEntry {
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
  picksUpdated: number;
  apiRequests: number;
  unmappedTeams: string[];
  unmappedPlayers: string[];
  errors: string[];
}

interface Props {
  teams: TeamRow[];
  players: PlayerRow[];
  log: SyncLogEntry[];
  inLiveWindow: boolean;
  apiKeyConfigured: boolean;
  espnTeams: EspnTeamRow[];
  espnLog: EspnLogEntry[];
}

type Tab = "status" | "teams" | "players" | "espn";

// ── Main component ────────────────────────────────────────────────────────────

export function SyncDashboard({ teams, players, log, inLiveWindow, apiKeyConfigured, espnTeams, espnLog }: Props) {
  const [tab, setTab] = useState<Tab>("status");

  return (
    <div>
      <div className="flex gap-1 border-b border-line mb-6 px-1">
        {(["status", "teams", "players", "espn"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize rounded-t transition-colors ${
              tab === t ? "text-brand border-b-2 border-brand" : "text-ink-2 hover:text-ink"
            }`}
          >
            {t === "teams" ? `Teams (${teams.filter(r => r.apiId).length}/${teams.length})` :
             t === "players" ? `Players (${players.filter(r => r.apiId).length}/${players.length})` :
             t === "espn" ? `ESPN (${espnTeams.filter(r => r.espnId).length}/${espnTeams.length})` :
             "Status"}
          </button>
        ))}
      </div>

      {tab === "status"  && <StatusTab log={log} inLiveWindow={inLiveWindow} apiKeyConfigured={apiKeyConfigured} />}
      {tab === "teams"   && <TeamsTab teams={teams} />}
      {tab === "players" && <PlayersTab players={players} />}
      {tab === "espn"    && <EspnTab teams={espnTeams} log={espnLog} />}
    </div>
  );
}

// ── Status tab ────────────────────────────────────────────────────────────────

function StatusTab({ log, inLiveWindow, apiKeyConfigured }: Pick<Props, "log" | "inLiveWindow" | "apiKeyConfigured">) {
  const [pending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<string | null>(null);

  function handleSync() {
    startTransition(async () => {
      const { result, error } = await triggerManualSync();
      if (error) {
        setLastResult(`Error: ${error}`);
      } else if (result) {
        setLastResult(
          result.skipped ? "Skipped (not in live window)" :
          `Done: ${result.matchesUpdated} matches, ${result.statsUpdated} stat rows, ${result.picksUpdated} picks. ${result.apiRequests} API requests. Errors: ${result.errors.length}`
        );
      }
    });
  }

  const latest = log[0];

  return (
    <div className="space-y-4">
      {!apiKeyConfigured && (
        <div className="rounded-xl bg-accent-red/10 border border-accent-red/30 px-4 py-3 text-sm text-accent-red">
          API_FOOTBALL_KEY is not configured. Manual entry still works; sync is disabled.
        </div>
      )}

      <div className="rounded-xl bg-paper-2 border border-line p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Live window</p>
            <p className="text-xs text-ink-2 mt-0.5">
              {inLiveWindow ? "A match is active — sync is polling." : "No active matches — sync is idle."}
            </p>
          </div>
          <span className={`w-3 h-3 rounded-full ${inLiveWindow ? "bg-accent-green" : "bg-ink-3"}`} />
        </div>
        <button
          onClick={handleSync}
          disabled={pending}
          className="rounded-lg bg-brand text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
        >
          {pending ? "Syncing…" : "Force sync now"}
        </button>
        {lastResult && <p className="text-xs text-ink-2">{lastResult}</p>}
      </div>

      {latest && (
        <div className="rounded-xl bg-paper-2 border border-line p-4 space-y-2">
          <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide">Last sync</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={latest.status} />
            <span className="text-sm">{fmt(latest.startedAt)}</span>
            <span className="text-xs text-ink-3">({latest.trigger})</span>
          </div>
          {!latest.skipped && (
            <div className="grid grid-cols-4 gap-2 text-xs text-ink-2 pt-1">
              <Stat label="Matches" value={latest.matchesUpdated} />
              <Stat label="Stats"   value={latest.statsUpdated}   />
              <Stat label="Picks"   value={latest.picksUpdated}   />
              <Stat label="API req" value={latest.apiRequests}    />
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
    </div>
  );
}

// ── Teams tab ─────────────────────────────────────────────────────────────────

function TeamsTab({ teams }: { teams: TeamRow[] }) {
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; code: string | null }>>([]);
  const [searchError, setSearchError] = useState("");
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  async function handleSearch() {
    setSearching(true);
    setSearchError("");
    const { teams: results, error } = await apiSearchTeams(searchQ);
    setSearching(false);
    if (error) { setSearchError(error); return; }
    setSearchResults(results ?? []);
  }

  async function handleSave(teamId: string) {
    const val = draftValues[teamId] ?? "";
    if (!val) return;
    setPendingIds((p) => ({ ...p, [teamId]: true }));
    const { error } = await setMapping("team", teamId, val);
    setPendingIds((p) => ({ ...p, [teamId]: false }));
    setMessages((m) => ({ ...m, [teamId]: error ?? "Saved" }));
    setTimeout(() => setMessages((m) => ({ ...m, [teamId]: "" })), 3000);
  }

  async function handleRemove(mappingId: string, teamId: string) {
    setPendingIds((p) => ({ ...p, [teamId]: true }));
    await removeMapping(mappingId);
    setPendingIds((p) => ({ ...p, [teamId]: false }));
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-2">
        Paste API-Football team IDs to link each team. Use the search to find the right ID.
        Once a team is mapped, the sync engine will auto-discover its fixtures.
      </p>

      <div className="flex gap-2">
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search API-Football (e.g. Spain)"
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
        <div className="rounded-xl bg-paper-2 border border-line divide-y divide-line">
          {searchResults.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-xs font-mono text-ink-3 w-12">{r.code}</span>
              <span className="flex-1 text-sm">{r.name}</span>
              <span className="text-xs font-mono text-brand">ID: {r.id}</span>
              <button
                onClick={() => {
                  const match = teams.find(t => t.name.toLowerCase() === r.name.toLowerCase() || t.fifaCode === r.code);
                  if (match) setDraftValues(d => ({ ...d, [match.id]: String(r.id) }));
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
              {team.apiId ? (
                <>
                  <span className="text-xs font-mono text-accent-green">#{team.apiId}</span>
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
                    onChange={(e) => setDraftValues(d => ({ ...d, [team.id]: e.target.value }))}
                    placeholder="API ID"
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
  );
}

// ── Players tab ───────────────────────────────────────────────────────────────

function PlayersTab({ players }: { players: PlayerRow[] }) {
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string }>>([]);
  const [searchError, setSearchError] = useState("");
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  async function handleSearch() {
    setSearching(true);
    setSearchError("");
    const { players: results, error } = await apiSearchPlayers(searchQ);
    setSearching(false);
    if (error) { setSearchError(error); return; }
    setSearchResults(results ?? []);
  }

  async function handleSave(pickId: string) {
    const val = draftValues[pickId] ?? "";
    if (!val) return;
    setPendingIds((p) => ({ ...p, [pickId]: true }));
    const { error } = await setMapping("player", pickId, val);
    setPendingIds((p) => ({ ...p, [pickId]: false }));
    setMessages((m) => ({ ...m, [pickId]: error ?? "Saved" }));
    setTimeout(() => setMessages((m) => ({ ...m, [pickId]: "" })), 3000);
  }

  async function handleRemove(mappingId: string, pickId: string) {
    setPendingIds((p) => ({ ...p, [pickId]: true }));
    await removeMapping(mappingId);
    setPendingIds((p) => ({ ...p, [pickId]: false }));
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-2">
        Link each user's efficiency pick to their API-Football player ID.
        The sync engine will fetch cumulative tournament goals/assists/minutes.
      </p>

      <div className="flex gap-2">
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search API-Football (e.g. Mbappe)"
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
        <div className="rounded-xl bg-paper-2 border border-line divide-y divide-line">
          {searchResults.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1 text-sm">{r.name}</span>
              <span className="text-xs font-mono text-brand">ID: {r.id}</span>
              <button
                onClick={() => {
                  const match = players.find(p => p.playerName.toLowerCase().includes(r.name.toLowerCase().split(" ").pop() ?? ""));
                  if (match) setDraftValues(d => ({ ...d, [match.pickId]: String(r.id) }));
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
        {players.map((p) => {
          const msg = messages[p.pickId];
          return (
            <div key={p.pickId} className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.playerName}</p>
                <p className="text-xs text-ink-3">{p.displayName} · {p.teamCode ?? "—"}</p>
              </div>
              {p.lastSyncedAt && (
                <span className="text-xs text-ink-3 shrink-0">synced {fmtShort(p.lastSyncedAt)}</span>
              )}
              {p.apiId ? (
                <>
                  <span className="text-xs font-mono text-accent-green">#{p.apiId}</span>
                  <button
                    onClick={() => p.mappingId && handleRemove(p.mappingId, p.pickId)}
                    disabled={pendingIds[p.pickId]}
                    className="text-xs text-ink-3 hover:text-accent-red disabled:opacity-50"
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <input
                    value={draftValues[p.pickId] ?? ""}
                    onChange={(e) => setDraftValues(d => ({ ...d, [p.pickId]: e.target.value }))}
                    placeholder="Player API ID"
                    className="w-28 rounded-lg bg-paper-2 border border-line-2 px-2 py-1 text-xs font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <button
                    onClick={() => handleSave(p.pickId)}
                    disabled={pendingIds[p.pickId] || !draftValues[p.pickId]}
                    className="rounded-lg bg-brand text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50"
                  >
                    {pendingIds[p.pickId] ? "…" : "Set"}
                  </button>
                  {msg && <span className={`text-xs ${msg === "Saved" ? "text-accent-green" : "text-accent-red"}`}>{msg}</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

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

function fmtShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
