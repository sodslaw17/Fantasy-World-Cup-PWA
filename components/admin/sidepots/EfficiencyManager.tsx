"use client";

import { useState } from "react";
import { saveEfficiencyPick } from "@/app/admin/sidepots/actions";
import { computeEfficiency } from "@/lib/scoring/sidepots";

interface Player {
  profileId: string;
  displayName: string;
  pick: {
    playerName: string;
    teamCode: string | null;
    goals: number;
    assists: number;
    minutes: number;
  } | null;
}

export function EfficiencyManager({ players }: { players: Player[] }) {
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function handleSave(profileId: string, formData: FormData) {
    setSaving(profileId);
    const result = await saveEfficiencyPick(profileId, formData);
    setSaving(null);
    setMessages((m) => ({ ...m, [profileId]: result.error ?? "Saved" }));
    setTimeout(() => setMessages((m) => ({ ...m, [profileId]: "" })), 3000);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-paper/50">
        Each player pre-drafted one footballer. Enter their final tournament stats
        — admin-entered, no API. Winner = highest (G+A)/minutes.
      </p>
      {players.map((player) => {
        const p = player.pick;
        const eff = p ? computeEfficiency(p.goals, p.assists, p.minutes) : null;
        const msg = messages[player.profileId];

        return (
          <div key={player.profileId}
            className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{player.displayName}</p>
              {eff !== null && (
                <span className="text-xs text-paper/50 tabular-nums">
                  eff = {eff.toFixed(4)}
                </span>
              )}
            </div>

            <form action={(fd) => handleSave(player.profileId, fd)} className="space-y-2">
              <div className="flex gap-2">
                <input name="player_name" type="text" placeholder="Footballer name"
                  defaultValue={p?.playerName ?? ""}
                  className="flex-1 rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm text-paper placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-gold" />
                <input name="team_code" type="text" placeholder="Team (e.g. BRA)"
                  defaultValue={p?.teamCode ?? ""}
                  className="w-24 rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm font-mono text-paper placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-gold" />
              </div>
              <input name="player_photo_url" type="text" placeholder="Footballer photo URL (optional)"
                defaultValue={(player as { pick: { playerPhotoUrl?: string } | null }).pick?.playerPhotoUrl ?? ""}
                className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2 text-sm text-paper placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-gold" />
              <div className="flex gap-2">
                {[
                  { name: "goals",   label: "Goals",   val: p?.goals   ?? 0 },
                  { name: "assists", label: "Assists",  val: p?.assists ?? 0 },
                  { name: "minutes", label: "Minutes",  val: p?.minutes ?? 0 },
                ].map(({ name, label, val }) => (
                  <div key={name} className="flex-1">
                    <label className="text-xs text-paper/50 block mb-1">{label}</label>
                    <input name={name} type="number" min={0} defaultValue={val}
                      className="w-full rounded-lg bg-ink border border-paper/20 px-2 py-1.5 text-sm text-center text-paper focus:outline-none focus:ring-1 focus:ring-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving === player.profileId}
                  className="rounded-lg bg-gold text-ink text-xs font-semibold px-4 py-2 min-h-tap disabled:opacity-50">
                  {saving === player.profileId ? "Saving…" : "Save"}
                </button>
                {msg && (
                  <span className={`text-xs ${msg === "Saved" ? "text-accent-green" : "text-accent-red"}`}>
                    {msg === "Saved" ? "✓ Saved" : msg}
                  </span>
                )}
              </div>
            </form>
          </div>
        );
      })}
    </div>
  );
}
