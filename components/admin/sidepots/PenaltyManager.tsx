"use client";

import { useActionState, useState } from "react";
import { addPenaltyEvent, removePenaltyEvent } from "@/app/admin/sidepots/actions";

const EVENT_TYPES = [
  { value: "off_target",    label: "Missed penalty (−1)"  },
  { value: "panenka_fail",  label: "Panenka fail (−1)" },
  { value: "panenka_score", label: "Panenka score (+1)" },
];

interface PenaltyMatch {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeCode: string;
  awayCode: string;
  kickoffUtc: string;
  events: {
    id: string;
    teamCode: string;
    playerName: string | null;
    type: string;
  }[];
}

const initState = { error: undefined as string | undefined, success: false };

function matchLabel(m: PenaltyMatch) {
  const d = new Date(m.kickoffUtc);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${date} · ${m.homeTeamName} vs ${m.awayTeamName}`;
}

export function PenaltyManager({ matches }: { matches: PenaltyMatch[] }) {
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
      <p className="text-sm text-ink-3 py-6 text-center">No matches available.</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-2">
        Record penalty events from any match — shootout or in-play.
        Off-target / Panenka fail = −1 pt · Panenka score = +1 pt to the drafter.
      </p>

      {/* Match selector */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-ink-2">Match</label>
        <select
          value={selectedMatch}
          onChange={(e) => setSelectedMatch(e.target.value)}
          className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand min-h-tap"
        >
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {matchLabel(m)}
            </option>
          ))}
        </select>
      </div>

      {match && (
        <>
          {/* Existing events for this match */}
          {match.events.length > 0 ? (
            <div className="rounded-xl bg-paper-2 border border-line divide-y divide-line">
              {match.events.map((evt) => (
                <div key={evt.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs font-mono text-ink-3 w-8 shrink-0">{evt.teamCode}</span>
                  <span className="flex-1 text-sm truncate">
                    {evt.playerName ?? <span className="text-ink-3 italic">unnamed</span>}
                  </span>
                  <span className={`text-xs font-medium shrink-0 ${
                    evt.type === "panenka_score" ? "text-accent-green" : "text-accent-red"
                  }`}>
                    {evt.type === "panenka_score" ? "+1" : "−1"} {evt.type.replace(/_/g, " ")}
                  </span>
                  <button
                    onClick={() => removePenaltyEvent(evt.id)}
                    className="text-ink-3 hover:text-accent-red text-lg leading-none px-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-3 text-center py-3 italic">No events recorded for this match.</p>
          )}

          {/* Add event form */}
          <form action={addAction} className="rounded-xl bg-paper-2 border border-line p-4 space-y-3">
            <p className="text-xs font-semibold text-ink-2">Add event</p>

            <div className="space-y-1">
              <label className="text-xs text-ink-3">Country</label>
              <select
                name="team_code"
                required
                className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand min-h-tap"
              >
                <option value={match.homeCode}>{match.homeTeamName} ({match.homeCode})</option>
                <option value={match.awayCode}>{match.awayTeamName} ({match.awayCode})</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-ink-3">Player name <span className="text-ink-3">(optional)</span></label>
              <input
                name="player_name"
                type="text"
                placeholder="e.g. Mbappe"
                className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand min-h-tap"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-ink-3">Event type</label>
              <select
                name="type"
                required
                className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand min-h-tap"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {addState.error && <p className="text-xs text-accent-red">{addState.error}</p>}
            {addState.success && <p className="text-xs text-accent-green">✓ Event added</p>}

            <button
              type="submit"
              disabled={addPending}
              className="w-full rounded-lg bg-brand text-white text-sm font-semibold py-2.5 min-h-tap disabled:opacity-50"
            >
              {addPending ? "Adding…" : "Add event"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
