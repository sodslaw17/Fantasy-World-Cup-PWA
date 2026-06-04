"use client";

import { useActionState, useRef, useState } from "react";
import { saveDraftPreferences } from "@/app/my-picks/actions";
import { SortableTeamList } from "./SortableTeamList";
import { SNAKE_PICKS } from "@/lib/draft";
import { FIFA_RANKING_ORDER } from "@/lib/fifa-ranking";

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

  // Build lookup: code → name
  const teamByCode = Object.fromEntries(teams.map((t) => [t.fifa_code, t.name]));

  // Build initial sorted team list — use saved wishlist order if it exists,
  // otherwise fall back to FIFA ranking order, then append any remaining teams
  const buildInitialOrder = (): { code: string; name: string }[] => {
    const saved = existing?.team_wishlist ?? [];
    const fallbackOrder = FIFA_RANKING_ORDER.filter((c) => teamByCode[c]);
    const allCodes = [
      ...saved.filter((c) => teamByCode[c]),
      ...fallbackOrder.filter((c) => !saved.includes(c)),
      ...teams.map((t) => t.fifa_code).filter((c) => !fallbackOrder.includes(c) && !saved.includes(c)),
    ];
    return allCodes.map((code) => ({ code, name: teamByCode[code] ?? code }));
  };

  const [orderedCodes, setOrderedCodes] = useState<string[]>(
    () => buildInitialOrder().map((t) => t.code)
  );
  const [initialTeams] = useState(() => buildInitialOrder());

  // Hidden input synced with current drag order
  const hiddenRef = useRef<HTMLInputElement>(null);

  function handleOrderChange(codes: string[]) {
    setOrderedCodes(codes);
    if (hiddenRef.current) hiddenRef.current.value = codes.join(",");
  }

  return (
    <form action={action} className="space-y-6">
      {/* Hidden: full team wishlist as comma-separated codes */}
      <input
        ref={hiddenRef}
        type="hidden"
        name="team_wishlist"
        defaultValue={orderedCodes.join(",")}
      />

      {/* Snake position preference */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          Preferred snake-draft position
        </label>
        <select
          name="preferred_position"
          defaultValue={existing?.preferred_position?.toString() ?? ""}
          className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold min-h-tap"
        >
          <option value="">— no preference —</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              Position {n} — picks {SNAKE_PICKS[n].join(", ")}
            </option>
          ))}
        </select>
      </div>

      {/* Team wishlist — drag to reorder */}
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium">Team preference order</label>
          <p className="text-xs text-paper/40 mt-0.5">
            Drag to rank all teams from most to least wanted. Default order is FIFA ranking.
            Hold briefly then drag on mobile.
          </p>
        </div>
        <SortableTeamList
          teams={initialTeams}
          onChange={handleOrderChange}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Notes for the admin</label>
        <textarea
          name="notes"
          defaultValue={existing?.notes ?? ""}
          rows={3}
          placeholder="Any instructions if you can't be reached during the draft…"
          className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-gold resize-y"
        />
      </div>

      {state.error && <p className="text-sm text-accent-red">{state.error}</p>}
      {state.success && <p className="text-sm text-accent-green">✓ Preferences saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gold text-ink font-semibold py-3 min-h-tap disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
