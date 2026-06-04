"use client";

import { useState } from "react";
import { SNAKE_PICKS } from "@/lib/draft";

interface Pref {
  preferred_position: number | null;
  position_preferences: number[] | null;
  team_wishlist: string[] | null;
  notes: string | null;
  updated_at: string;
}

export function PreferenceAccordion({
  displayName,
  pref,
  teamNames,
}: {
  displayName: string;
  pref: Pref | null;
  teamNames: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-ink-soft border border-paper/10 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-tap text-left"
      >
        <span className="text-sm font-semibold">{displayName}</span>
        <div className="flex items-center gap-2">
          {!pref && (
            <span className="text-xs text-paper/30 italic">no preferences</span>
          )}
          {pref && !open && (
            <span className="text-xs text-paper/30">click to reveal</span>
          )}
          <span className="text-paper/40 text-sm transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▾
          </span>
        </div>
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-paper/10 pt-3">
          {!pref ? (
            <p className="text-xs text-paper/40 italic">No preferences submitted yet.</p>
          ) : (
            <>
              {/* Position preferences */}
              {pref.position_preferences?.length ? (
                <div>
                  <p className="text-xs text-paper/50 mb-1">Position ranking (top = most preferred)</p>
                  <ol className="space-y-0.5">
                    {pref.position_preferences.map((n, i) => (
                      <li key={n} className="text-xs font-mono">
                        <span className="text-paper/40">{i + 1}. </span>
                        Position {n} — picks {SNAKE_PICKS[n]?.join(", ")}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : pref.preferred_position ? (
                <p className="text-xs">
                  <span className="text-paper/50">Preferred: </span>
                  Position {pref.preferred_position} — picks {SNAKE_PICKS[pref.preferred_position]?.join(", ")}
                </p>
              ) : null}

              {/* Team wishlist */}
              {pref.team_wishlist?.length ? (
                <div>
                  <p className="text-xs text-paper/50 mb-1">
                    Team ranking ({pref.team_wishlist.length} teams)
                  </p>
                  <ol className="space-y-0.5 max-h-48 overflow-y-auto">
                    {pref.team_wishlist.map((code, i) => (
                      <li key={code} className="text-xs">
                        <span className="text-paper/40 font-mono w-6 inline-block">{i + 1}.</span>
                        <span className="font-mono text-paper/50 mr-1.5">{code}</span>
                        {teamNames[code] ?? code}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {/* Notes */}
              {pref.notes && (
                <div>
                  <p className="text-xs text-paper/50">Notes</p>
                  <p className="text-xs text-paper/80 bg-ink rounded p-2 mt-1 whitespace-pre-wrap">
                    {pref.notes}
                  </p>
                </div>
              )}

              <p className="text-xs text-paper/30">
                Updated {new Date(pref.updated_at).toLocaleString()}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
