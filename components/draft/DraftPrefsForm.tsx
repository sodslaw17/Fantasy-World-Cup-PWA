"use client";

import { useActionState, useRef, useState } from "react";
import { saveDraftPreferences } from "@/app/my-picks/actions";
import { SortableList } from "./SortableList";
import { SNAKE_PICKS } from "@/lib/draft";
import { FIFA_RANKING_ORDER } from "@/lib/fifa-ranking";

const initState = { error: undefined as string | undefined, success: false };

interface Team { fifa_code: string; name: string; group_letter: string | null; }
interface Prefs {
  preferred_position: number | null;
  position_preferences: number[] | null;
  team_wishlist: string[] | null;
  notes: string | null;
}

function buildPositionItems(savedOrder?: number[] | null) {
  const all = Array.from({ length: 10 }, (_, i) => i + 1);
  const ordered = savedOrder?.length
    ? [...savedOrder, ...all.filter((n) => !savedOrder.includes(n))]
    : all;
  return ordered.map((n) => ({
    id: String(n),
    label: `Position ${n}`,
    sublabel: `picks ${SNAKE_PICKS[n].join(", ")}`,
  }));
}

export function DraftPrefsForm({ teams, existing }: { teams: Team[]; existing: Prefs | null }) {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initState, fd: FormData) => {
      const r = await saveDraftPreferences(fd);
      return { error: r.error, success: r.success ?? false };
    },
    initState
  );

  const [initialPositionItems] = useState(() =>
    buildPositionItems(existing?.position_preferences)
  );
  const positionRef = useRef<HTMLInputElement>(null);
  const [positionOrder, setPositionOrder] = useState<string[]>(
    () => initialPositionItems.map((i) => i.id)
  );

  function handlePositionChange(ids: string[]) {
    setPositionOrder(ids);
    if (positionRef.current) positionRef.current.value = ids.join(",");
  }

  const teamByCode = Object.fromEntries(teams.map((t) => [t.fifa_code, t.name]));

  const [initialTeamItems] = useState(() => {
    const saved = existing?.team_wishlist ?? [];
    const fallback = FIFA_RANKING_ORDER.filter((c) => teamByCode[c]);
    const ordered = [
      ...saved.filter((c) => teamByCode[c]),
      ...fallback.filter((c) => !saved.includes(c)),
      ...teams.map((t) => t.fifa_code).filter((c) => !fallback.includes(c) && !saved.includes(c)),
    ];
    return ordered.map((code) => ({ id: code, badge: code, label: teamByCode[code] ?? code }));
  });

  const teamRef = useRef<HTMLInputElement>(null);

  function handleTeamChange(codes: string[]) {
    if (teamRef.current) teamRef.current.value = codes.join(",");
  }

  return (
    <form action={action} className="space-y-8">
      <input ref={positionRef} type="hidden" name="position_preferences"
        defaultValue={positionOrder.join(",")} />
      <input ref={teamRef} type="hidden" name="team_wishlist"
        defaultValue={initialTeamItems.map((t) => t.id).join(",")} />

      {/* Position preference */}
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium text-ink">Draft position preference</label>
          <p className="text-xs text-ink-3 mt-0.5">
            Drag to rank positions from most to least preferred. Position at the top
            is your first choice. Each row shows which overall picks that position gets.
          </p>
        </div>
        <SortableList
          initialItems={initialPositionItems}
          onChange={handlePositionChange}
        />
      </div>

      {/* Team preference */}
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium text-ink">Team preference order</label>
          <p className="text-xs text-ink-3 mt-0.5">
            Drag to rank all teams from most to least wanted.
            Default order is FIFA ranking. Hold briefly then drag on mobile.
          </p>
        </div>
        <SortableList
          initialItems={initialTeamItems}
          onChange={handleTeamChange}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-ink">Notes for the admin</label>
        <textarea
          name="notes"
          defaultValue={existing?.notes ?? ""}
          rows={3}
          placeholder="Any instructions if you can't be reached during the draft…"
          className="w-full rounded-lg bg-surface border border-line-2 px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand resize-y"
        />
      </div>

      {state.error && <p className="text-sm text-red-ink">{state.error}</p>}
      {state.success && <p className="text-sm text-green-ink">✓ Preferences saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand text-brand-on font-semibold py-3 min-h-[48px] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
