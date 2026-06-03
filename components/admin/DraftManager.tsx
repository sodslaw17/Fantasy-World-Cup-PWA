"use client";

import { useState } from "react";
import { setUserDraft, lockDraft } from "@/app/admin/draft/actions";

interface Team {
  id: string;
  fifa_code: string;
  name: string;
  group_letter: string | null;
}

interface Player {
  id: string;
  display_name: string;
  picks: Team[]; // currently assigned teams
}

export function DraftManager({
  players,
  allTeams,
  draftLocked,
}: {
  players: Player[];
  allTeams: Team[];
  draftLocked: boolean;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState<string>();

  // Local selections: profileId → [teamId, teamId, teamId]
  const [selections, setSelections] = useState<Record<string, string[]>>(
    () =>
      Object.fromEntries(
        players.map((p) => [p.id, p.picks.map((t) => t.id)])
      )
  );

  // All team IDs currently assigned to OTHER users
  const assignedElsewhere = (excludeProfileId: string) =>
    new Set(
      Object.entries(selections)
        .filter(([pid]) => pid !== excludeProfileId)
        .flatMap(([, ids]) => ids)
        .filter(Boolean)
    );

  function setSlot(profileId: string, slotIndex: number, teamId: string) {
    setSelections((prev) => {
      const current = [...(prev[profileId] ?? [])];
      current[slotIndex] = teamId;
      return { ...prev, [profileId]: current };
    });
  }

  function removeSlot(profileId: string, slotIndex: number) {
    setSelections((prev) => {
      const current = [...(prev[profileId] ?? [])];
      current.splice(slotIndex, 1);
      return { ...prev, [profileId]: current };
    });
  }

  async function handleSave(profileId: string) {
    const teamIds = (selections[profileId] ?? []).filter(Boolean);
    setSaving(profileId);
    const result = await setUserDraft(profileId, teamIds);
    setSaving(null);
    setMessages((m) => ({
      ...m,
      [profileId]: result.error ?? "Saved",
    }));
    setTimeout(
      () => setMessages((m) => ({ ...m, [profileId]: "" })),
      3000
    );
  }

  async function handleLock() {
    if (!confirm("Lock the draft? This cannot be undone.")) return;
    setLocking(true);
    const result = await lockDraft();
    setLocking(false);
    if (result.error) setLockError(result.error);
  }

  const totalAssigned = Object.values(selections).flat().filter(Boolean).length;
  const allAssigned = players.every(
    (p) => (selections[p.id] ?? []).filter(Boolean).length === 3
  );

  // Group teams for select rendering
  const teamsByGroup: Record<string, Team[]> = {};
  for (const t of allTeams) {
    const g = t.group_letter ?? "?";
    (teamsByGroup[g] ??= []).push(t);
  }

  if (draftLocked) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-accent-green/10 border border-accent-green/30 text-accent-green px-4 py-3 text-sm font-medium">
          🔒 Draft is locked — picks are final.
        </div>
        {players.map((p) => (
          <div key={p.id} className="rounded-xl bg-ink-soft border border-paper/10 p-4">
            <p className="text-sm font-semibold mb-2">{p.display_name}</p>
            {p.picks.length === 0 ? (
              <p className="text-xs text-paper/40">No teams assigned</p>
            ) : (
              <div className="space-y-1">
                {p.picks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-mono text-paper/40 w-8">{t.fifa_code}</span>
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress + lock */}
      <div className="rounded-xl bg-ink-soft border border-paper/10 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {totalAssigned} / {players.length * 3} teams assigned
          </p>
          {!allAssigned && (
            <p className="text-xs text-paper/40">
              Each player needs exactly 3 teams
            </p>
          )}
        </div>
        <button
          onClick={handleLock}
          disabled={locking || !allAssigned}
          className="rounded-lg bg-accent-red text-paper text-sm font-semibold px-4 py-2 min-h-tap disabled:opacity-40"
        >
          {locking ? "Locking…" : "🔒 Lock draft"}
        </button>
      </div>
      {lockError && <p className="text-xs text-accent-red">{lockError}</p>}

      {/* Per-player cards */}
      {players.map((player) => {
        const playerSelections = selections[player.id] ?? [];
        const taken = assignedElsewhere(player.id);
        const msg = messages[player.id];

        return (
          <div
            key={player.id}
            className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{player.display_name}</p>
              <div className="flex items-center gap-2">
                {msg && (
                  <span
                    className={`text-xs ${
                      msg === "Saved"
                        ? "text-accent-green"
                        : "text-accent-red"
                    }`}
                  >
                    {msg === "Saved" ? "✓ Saved" : msg}
                  </span>
                )}
                <button
                  onClick={() => handleSave(player.id)}
                  disabled={saving === player.id}
                  className="text-xs bg-gold text-ink font-semibold px-3 py-1.5 rounded-lg min-h-tap disabled:opacity-50"
                >
                  {saving === player.id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {/* 3 team slots */}
            <div className="space-y-2">
              {[0, 1, 2].map((slot) => {
                const selectedId = playerSelections[slot] ?? "";
                return (
                  <div key={slot} className="flex items-center gap-2">
                    <span className="text-xs text-paper/40 w-5 text-center">
                      {slot + 1}
                    </span>
                    <select
                      value={selectedId}
                      onChange={(e) => setSlot(player.id, slot, e.target.value)}
                      className="flex-1 rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold min-h-tap"
                    >
                      <option value="">— select team —</option>
                      {Object.keys(teamsByGroup)
                        .sort()
                        .map((letter) => (
                          <optgroup key={letter} label={`Group ${letter}`}>
                            {teamsByGroup[letter].map((t) => {
                              const takenByOther =
                                taken.has(t.id) && t.id !== selectedId;
                              return (
                                <option
                                  key={t.id}
                                  value={t.id}
                                  disabled={takenByOther}
                                >
                                  {t.name}
                                  {takenByOther ? " (taken)" : ""}
                                </option>
                              );
                            })}
                          </optgroup>
                        ))}
                    </select>
                    {selectedId && (
                      <button
                        onClick={() => removeSlot(player.id, slot)}
                        className="text-paper/30 hover:text-accent-red text-lg leading-none px-1"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
