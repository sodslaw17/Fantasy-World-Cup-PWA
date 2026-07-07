"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAdminPredictions } from "@/app/admin/predictions/actions";

interface User {
  profileId: string;
  displayName: string;
  authId: string | null;
}

interface MatchRow {
  id: string;
  group_letter: string | null;
  kickoff_utc: string;
  homeTeamName: string;
  awayTeamName: string;
}

type PredState = Record<string, { home: string; away: string }>;

function initPreds(existing: Record<string, { home: number; away: number }>): PredState {
  return Object.fromEntries(
    Object.entries(existing).map(([mid, { home, away }]) => [mid, { home: String(home), away: String(away) }])
  );
}

export function PredictionsManager({
  users,
  selectedProfileId,
  selectedAuthId,
  matches,
  existingPredictions,
}: {
  users: User[];
  selectedProfileId: string | null;
  selectedAuthId: string | null;
  matches: MatchRow[];
  existingPredictions: Record<string, { home: number; away: number }>;
}) {
  const router = useRouter();
  const [preds, setPreds] = useState<PredState>(() => initPreds(existingPredictions));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  // Re-init preds when the selected user changes (navigates to new URL, remounts)
  // Because this is a controlled component, server re-renders with new existingPredictions.
  // useState initial value only runs once, but the key on the parent or a useEffect would be needed
  // for dynamic updates. Instead, we let Next.js remount by changing ?user= param.

  function handleUserChange(profileId: string) {
    setMessage("");
    router.push(`/admin/predictions?user=${profileId}`);
  }

  function setPred(matchId: string, side: "home" | "away", raw: string) {
    setPreds((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId] ?? { home: "", away: "" }, [side]: raw },
    }));
  }

  function handleSave() {
    if (!selectedAuthId) return;

    // Only save matches where both fields are valid non-negative integers
    const payload = Object.entries(preds)
      .filter(([, { home, away }]) => {
        const h = parseInt(home);
        const a = parseInt(away);
        return home !== "" && away !== "" && !isNaN(h) && !isNaN(a) && h >= 0 && a >= 0;
      })
      .map(([match_id, { home, away }]) => ({
        match_id,
        home: parseInt(home),
        away: parseInt(away),
      }));

    startTransition(async () => {
      const result = await saveAdminPredictions(selectedAuthId, payload);
      if (result.error) {
        setMessage(`Error: ${result.error}`);
      } else {
        setMessage(`Saved ${result.count} predictions`);
      }
      setTimeout(() => setMessage(""), 4000);
    });
  }

  // Group matches by letter
  const groups = matches.reduce<Record<string, MatchRow[]>>((acc, m) => {
    const letter = m.group_letter ?? "?";
    (acc[letter] ??= []).push(m);
    return acc;
  }, {});

  const filledCount = Object.values(preds).filter(
    ({ home, away }) => home !== "" && away !== ""
  ).length;

  return (
    <div className="space-y-4">
      {/* User selector */}
      <select
        value={selectedProfileId ?? ""}
        onChange={(e) => { if (e.target.value) handleUserChange(e.target.value); }}
        className="w-full rounded-lg bg-paper-2 border border-line-2 px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <option value="">Select a player…</option>
        {users.map((u) => (
          <option key={u.profileId} value={u.profileId}>
            {u.displayName}{!u.authId ? " (not logged in yet)" : ""}
          </option>
        ))}
      </select>

      {selectedProfileId && !selectedAuthId && (
        <div className="rounded-xl bg-accent-red/10 border border-accent-red/30 px-4 py-3">
          <p className="text-sm text-accent-red">
            This player hasn&apos;t logged in yet. Ask them to sign in first, then come back here.
          </p>
        </div>
      )}

      {selectedProfileId && selectedAuthId && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-3">
              {filledCount} / {matches.length} predictions filled in
            </p>
          </div>

          {Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, gMatches]) => (
              <div key={letter} className="rounded-xl bg-paper-2 border border-line overflow-hidden">
                <div className="px-4 py-2 border-b border-line bg-paper/5">
                  <span className="text-xs font-semibold text-ink-2">Group {letter}</span>
                </div>
                <div className="divide-y divide-paper/5">
                  {gMatches.map((m) => {
                    const pred = preds[m.id] ?? { home: "", away: "" };
                    const date = new Date(m.kickoff_utc).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "America/Chicago",
                    });
                    return (
                      <div key={m.id} className="px-3 py-2.5 flex items-center gap-2">
                        <span className="text-xs text-ink-3 w-12 shrink-0">{date}</span>
                        <span className="flex-1 text-right text-xs text-ink truncate">
                          {m.homeTeamName}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={pred.home}
                            placeholder="–"
                            onChange={(e) => setPred(m.id, "home", e.target.value)}
                            className="w-10 text-center rounded bg-paper-2 border border-line-2 px-1 py-1 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-ink-3 text-xs select-none">–</span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={pred.away}
                            placeholder="–"
                            onChange={(e) => setPred(m.id, "away", e.target.value)}
                            className="w-10 text-center rounded bg-paper-2 border border-line-2 px-1 py-1 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <span className="flex-1 text-left text-xs text-ink truncate">
                          {m.awayTeamName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          <div className="flex items-center gap-4 pt-2 pb-8">
            <button
              onClick={handleSave}
              disabled={isPending || filledCount === 0}
              className="rounded-lg bg-gold text-ink font-semibold px-6 py-3 min-h-tap disabled:opacity-50 active:scale-95 transition-transform"
            >
              {isPending ? "Saving…" : `Save ${filledCount} predictions`}
            </button>
            {message && (
              <span
                className={`text-sm ${
                  message.startsWith("Error") ? "text-accent-red" : "text-accent-green"
                }`}
              >
                {message.startsWith("Error") ? message : `✓ ${message}`}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
