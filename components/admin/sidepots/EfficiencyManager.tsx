"use client";

import { useState } from "react";
import {
  saveEfficiencyPick, updateEfficiencyPhoto,
  saveEfficiencyMatchStats, deleteEfficiencyMatchStat,
} from "@/app/admin/sidepots/actions";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { computeEfficiency } from "@/lib/scoring/sidepots";

interface Row {
  rowId: string | null;
  matchId: string;
  label: string;
  goals: number;
  assists: number;
  minutes: number;
  isAuto: boolean;
}

interface PriorTotal {
  rowId: string;
  goals: number;
  assists: number;
  minutes: number;
}

interface Pick {
  id: string;
  playerName: string;
  teamCode: string | null;
  playerPhotoUrl: string | null;
  goals: number;
  assists: number;
  minutes: number;
  priorTotal: PriorTotal | null;
  rows: Row[];
  otherMatches: { id: string; label: string }[];
}

interface Player {
  profileId: string;
  displayName: string;
  pick: Pick | null;
}

export function EfficiencyManager({ players }: { players: Player[] }) {
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [extraMatchIds, setExtraMatchIds] = useState<Record<string, string[]>>({});
  const [pendingExtra, setPendingExtra] = useState<Record<string, string>>({});

  function flash(profileId: string, text: string) {
    setMessages((m) => ({ ...m, [profileId]: text }));
    setTimeout(() => setMessages((m) => ({ ...m, [profileId]: "" })), 3000);
  }

  async function handleSaveProfile(profileId: string, formData: FormData) {
    setSaving(profileId);
    const result = await saveEfficiencyPick(profileId, formData);
    setSaving(null);
    flash(profileId, result.error ?? "Saved");
  }

  async function handleSaveStats(pickId: string, profileId: string, form: HTMLFormElement) {
    const fd = new FormData(form);
    const rowKeys = new Set<string>();
    for (const key of fd.keys()) {
      const m = /^goals__(.+)$/.exec(key);
      if (m) rowKeys.add(m[1]);
    }
    const rows = Array.from(rowKeys).map((rowKey) => ({
      matchId: rowKey === "prior" ? null : rowKey,
      goals: parseInt(fd.get(`goals__${rowKey}`) as string) || 0,
      assists: parseInt(fd.get(`assists__${rowKey}`) as string) || 0,
      minutes: parseInt(fd.get(`minutes__${rowKey}`) as string) || 0,
    }));

    setSaving(`stats-${profileId}`);
    const result = await saveEfficiencyMatchStats(pickId, rows);
    setSaving(null);
    flash(profileId, result.error ?? "Saved");
  }

  function handleAddRow(profileId: string) {
    const matchId = pendingExtra[profileId];
    if (!matchId) return;
    setExtraMatchIds((e) => ({ ...e, [profileId]: [...(e[profileId] ?? []), matchId] }));
    setPendingExtra((v) => ({ ...v, [profileId]: "" }));
  }

  function handleRemoveLocalRow(profileId: string, matchId: string) {
    setExtraMatchIds((e) => ({ ...e, [profileId]: (e[profileId] ?? []).filter((id) => id !== matchId) }));
  }

  async function handleDeleteRow(profileId: string, rowId: string) {
    setSaving(`del-${rowId}`);
    await deleteEfficiencyMatchStat(rowId);
    setSaving(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-2">
        Each player pre-drafted one footballer. Fill in goals / assists / minutes per game
        below — rows are pre-filled from the player&apos;s team fixtures. Totals and per-90 are
        computed automatically. Winner = highest (G+A)/minutes.
      </p>
      {players.map((player) => {
        const p = player.pick;
        const eff = p ? computeEfficiency(p.goals, p.assists, p.minutes) : null;
        const msg = messages[player.profileId];
        const localExtraIds = extraMatchIds[player.profileId] ?? [];
        const localExtraRows = p ? p.otherMatches.filter((m) => localExtraIds.includes(m.id)) : [];
        const availableToAdd = p ? p.otherMatches.filter((m) => !localExtraIds.includes(m.id)) : [];

        return (
          <div key={player.profileId}
            className="rounded-xl bg-paper-2 border border-line p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{player.displayName}</p>
              {eff !== null && (
                <span className="text-xs text-ink-2 tabular-nums">eff = {eff.toFixed(4)}</span>
              )}
            </div>

            <div>
              <p className="text-xs text-ink-2 mb-1.5">Player photo</p>
              <ImageUpload
                bucket="player-photos"
                storagePath={player.profileId}
                currentUrl={p?.playerPhotoUrl ?? null}
                shape="square"
                size="md"
                onComplete={async (url) => {
                  await updateEfficiencyPhoto(player.profileId, url);
                }}
              />
            </div>

            <form action={(fd) => handleSaveProfile(player.profileId, fd)} className="flex gap-2">
              <input type="hidden" name="player_photo_url" value={p?.playerPhotoUrl ?? ""} />
              <input name="player_name" type="text" placeholder="Footballer name"
                defaultValue={p?.playerName ?? ""}
                className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand" />
              <input name="team_code" type="text" placeholder="Team (e.g. BRA)"
                defaultValue={p?.teamCode ?? ""}
                className="w-24 rounded-lg bg-paper-2 border border-line-2 px-3 py-2 text-sm font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand" />
              <button type="submit" disabled={saving === player.profileId}
                className="rounded-lg bg-brand text-white text-xs font-semibold px-3 disabled:opacity-50">
                {saving === player.profileId ? "…" : "Save"}
              </button>
            </form>

            {p && (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSaveStats(p.id, player.profileId, e.currentTarget); }}
                className="space-y-2"
              >
                <div className="rounded-lg border border-line overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-paper-3 text-ink-2">
                        <th className="text-left font-medium px-2 py-1.5">Game</th>
                        <th className="font-medium px-2 py-1.5 w-14">Goals</th>
                        <th className="font-medium px-2 py-1.5 w-14">Assists</th>
                        <th className="font-medium px-2 py-1.5 w-16">Minutes</th>
                        <th className="w-6" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {p.priorTotal && (
                        <StatRow rowKey="prior" label="Prior total (pre-migration)" italic
                          goals={p.priorTotal.goals} assists={p.priorTotal.assists} minutes={p.priorTotal.minutes} />
                      )}
                      {p.rows.map((row) => (
                        <StatRow key={row.matchId} rowKey={row.matchId} label={row.label}
                          goals={row.goals} assists={row.assists} minutes={row.minutes}
                          onDelete={
                            !row.isAuto && row.rowId
                              ? () => handleDeleteRow(player.profileId, row.rowId!)
                              : undefined
                          }
                          deleting={saving === `del-${row.rowId}`}
                        />
                      ))}
                      {localExtraRows.map((m) => (
                        <StatRow key={m.id} rowKey={m.id} label={m.label}
                          goals={0} assists={0} minutes={0}
                          onDelete={() => handleRemoveLocalRow(player.profileId, m.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {availableToAdd.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={pendingExtra[player.profileId] ?? ""}
                      onChange={(e) => setPendingExtra((v) => ({ ...v, [player.profileId]: e.target.value }))}
                      className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-2 py-1.5 text-xs text-ink"
                    >
                      <option value="">Add another match…</option>
                      {availableToAdd.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => handleAddRow(player.profileId)}
                      className="text-xs text-brand underline shrink-0">
                      Add
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg bg-paper-3 px-3 py-2">
                  <span className="text-xs text-ink-2">
                    Total: <span className="font-semibold text-ink">{p.goals}G / {p.assists}A / {p.minutes}min</span>
                  </span>
                  <span className="text-xs text-ink-2">
                    Per-90: <span className="font-semibold text-ink">{eff !== null ? (eff * 90).toFixed(2) : "—"}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={saving === `stats-${player.profileId}`}
                    className="rounded-lg bg-brand text-white text-xs font-semibold px-4 py-2 min-h-tap disabled:opacity-50">
                    {saving === `stats-${player.profileId}` ? "Saving…" : "Save games"}
                  </button>
                  {msg && (
                    <span className={`text-xs ${msg === "Saved" ? "text-accent-green" : "text-accent-red"}`}>
                      {msg === "Saved" ? `✓ ${msg}` : msg}
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatRow({ rowKey, label, goals, assists, minutes, italic, onDelete, deleting }: {
  rowKey: string;
  label: string;
  goals: number;
  assists: number;
  minutes: number;
  italic?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <tr>
      <td className={`px-2 py-1.5 ${italic ? "italic text-ink-2" : "text-ink"}`}>{label}</td>
      {[
        { name: `goals__${rowKey}`, val: goals },
        { name: `assists__${rowKey}`, val: assists },
        { name: `minutes__${rowKey}`, val: minutes },
      ].map(({ name, val }) => (
        <td key={name} className="px-1 py-1">
          <input name={name} type="number" min={0} defaultValue={val}
            className="w-full rounded bg-paper-2 border border-line-2 px-1.5 py-1 text-xs text-center text-ink focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </td>
      ))}
      <td className="text-center">
        {onDelete && (
          <button type="button" onClick={onDelete} disabled={deleting}
            className="text-ink-3 hover:text-accent-red disabled:opacity-50">
            ×
          </button>
        )}
      </td>
    </tr>
  );
}
