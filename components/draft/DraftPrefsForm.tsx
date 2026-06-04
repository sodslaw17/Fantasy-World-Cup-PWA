"use client";

import { useActionState, useState } from "react";
import { saveDraftPreferences } from "@/app/my-picks/actions";
import { SNAKE_PICKS } from "@/lib/draft";

const initState = { error: undefined as string | undefined, success: false };

interface Team { fifa_code: string; name: string; group_letter: string | null; }
interface Prefs {
  preferred_position: number | null;
  team_wishlist: string[] | null;
  notes: string | null;
}

export function DraftPrefsForm({ teams, existing }: { teams: Team[]; existing: Prefs | null }) {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initState, fd: FormData) => {
      const r = await saveDraftPreferences(fd);
      return { error: r.error, success: r.success ?? false };
    },
    initState
  );

  const [wishlist, setWishlist] = useState<string[]>(existing?.team_wishlist ?? []);

  // Groups for select option grouping
  const byGroup: Record<string, Team[]> = {};
  for (const t of teams) {
    const g = t.group_letter ?? "?";
    (byGroup[g] ??= []).push(t);
  }

  function addSlot() {
    if (wishlist.length < 10) setWishlist([...wishlist, ""]);
  }
  function setSlot(i: number, code: string) {
    const next = [...wishlist];
    next[i] = code;
    setWishlist(next);
  }
  function removeSlot(i: number) {
    setWishlist(wishlist.filter((_, j) => j !== i));
  }

  return (
    <form action={action} className="space-y-5">
      {/* Snake position preference */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Preferred snake-draft position</label>
        <select name="preferred_position"
          defaultValue={existing?.preferred_position?.toString() ?? ""}
          className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold min-h-tap">
          <option value="">— no preference —</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              Position {n} — picks {SNAKE_PICKS[n].join(", ")}
            </option>
          ))}
        </select>
        <p className="text-xs text-paper/40">
          Position 1 = first pick overall AND last pick of round 2 (snake draft).
        </p>
      </div>

      {/* Team wishlist */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Team wishlist (ranked, 1st = top pick)</label>
        {wishlist.map((code, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-paper/40 w-5 text-right shrink-0">{i + 1}</span>
            <input type="hidden" name={`team_${i + 1}`} value={code} />
            <select value={code} onChange={(e) => setSlot(i, e.target.value)}
              className="flex-1 rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold min-h-tap">
              <option value="">— select team —</option>
              {Object.keys(byGroup).sort().map((g) => (
                <optgroup key={g} label={`Group ${g}`}>
                  {byGroup[g].map((t) => (
                    <option key={t.fifa_code} value={t.fifa_code}>{t.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button type="button" onClick={() => removeSlot(i)}
              className="text-paper/30 hover:text-accent-red text-lg px-1">×</button>
          </div>
        ))}
        {/* Fill hidden inputs for unused slots */}
        {Array.from({ length: 10 - wishlist.length }, (_, i) => (
          <input key={i} type="hidden" name={`team_${wishlist.length + i + 1}`} value="" />
        ))}
        {wishlist.length < 10 && (
          <button type="button" onClick={addSlot}
            className="text-xs text-gold underline underline-offset-2">
            + Add team
          </button>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Notes for the admin</label>
        <textarea name="notes" defaultValue={existing?.notes ?? ""} rows={3}
          placeholder="Any instructions if you can't be reached during the draft…"
          className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-gold resize-y" />
      </div>

      {state.error && <p className="text-sm text-accent-red">{state.error}</p>}
      {state.success && <p className="text-sm text-accent-green">✓ Preferences saved.</p>}

      <button type="submit" disabled={pending}
        className="w-full rounded-lg bg-gold text-ink font-semibold py-3 min-h-tap disabled:opacity-50">
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
