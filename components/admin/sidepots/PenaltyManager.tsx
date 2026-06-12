"use client";

import { useActionState, useState } from "react";
import { addPenaltyEvent, removePenaltyEvent } from "@/app/admin/sidepots/actions";

const EVENT_TYPES = [
  { value: "off_target",    label: "Off-target (−1)"  },
  { value: "panenka_fail",  label: "Panenka fail (−1)" },
  { value: "panenka_score", label: "Panenka score (+1)" },
];

interface ShootoutMatch {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeCode: string;
  awayCode: string;
  events: {
    id: string;
    teamCode: string;
    playerName: string | null;
    type: string;
  }[];
}

const initState = { error: undefined as string | undefined, success: false };

export function PenaltyManager({ matches }: { matches: ShootoutMatch[] }) {
  const [selectedMatch, setSelectedMatch] = useState(matches[0]?.id ?? "");

  const match = matches.find((m) => m.id === selectedMatch);

  const [addState, addAction, addPending] = useActionState(
    async (_prev: typeof initState, fd: FormData) => {
      fd.set("match_id", selectedMatch);
      const r = await addPenaltyEvent(fd);
      return { error: r.error, success: r.success ?? false };
    },
    initState
  );

  if (matches.length === 0) {
    return (
      <p className="text-sm text-paper/40 py-6 text-center">
        No penalty shootouts recorded yet. Mark a match as going to shootout in Results.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-paper/50">
        Events affect the drafter&apos;s knockout score: −1 off-target, −1 Panenka fail, +1 Panenka score.
      </p>

      {/* Match selector */}
      <select value={selectedMatch} onChange={(e) => setSelectedMatch(e.target.value)}
        className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold min-h-tap">
        {matches.map((m) => (
          <option key={m.id} value={m.id}>
            {m.homeTeamName} vs {m.awayTeamName}
          </option>
        ))}
      </select>

      {match && (
        <>
          {/* Existing events */}
          {match.events.length > 0 ? (
            <div className="rounded-xl bg-ink-soft border border-paper/10 divide-y divide-paper/10">
              {match.events.map((evt) => (
                <div key={evt.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs font-mono text-paper/40 w-8">{evt.teamCode}</span>
                  <span className="flex-1 text-sm">
                    {evt.playerName ?? <span className="text-paper/40 italic">unnamed</span>}
                  </span>
                  <span className={`text-xs font-medium ${
                    evt.type === "panenka_score" ? "text-accent-green" : "text-accent-red"
                  }`}>
                    {evt.type === "panenka_score" ? "+1" : "−1"} {evt.type.replace(/_/g, " ")}
                  </span>
                  <button onClick={() => removePenaltyEvent(evt.id)}
                    className="text-paper/30 hover:text-accent-red text-lg leading-none px-1">
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-paper/40 text-center py-4">No events yet.</p>
          )}

          {/* Add event */}
          <form action={addAction} className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-paper/60">Add event</p>
            <select name="team_code" required
              className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold min-h-tap">
              <option value={match.homeCode}>{match.homeTeamName} ({match.homeCode})</option>
              <option value={match.awayCode}>{match.awayTeamName} ({match.awayCode})</option>
            </select>
            <input name="player_name" type="text" placeholder="Player name (optional)"
              className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-gold min-h-tap" />
            <select name="type" required
              className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold min-h-tap">
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {addState.error && <p className="text-xs text-accent-red">{addState.error}</p>}
            {addState.success && <p className="text-xs text-accent-green">✓ Event added</p>}
            <button type="submit" disabled={addPending}
              className="w-full rounded-lg bg-gold text-ink text-sm font-semibold py-2.5 min-h-tap disabled:opacity-50">
              {addPending ? "Adding…" : "Add event"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
