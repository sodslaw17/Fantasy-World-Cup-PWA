"use client";

import { SortableList } from "./SortableList";

interface Team { code: string; name: string; }

export function SortableTeamList({
  teams,
  onChange,
}: {
  teams: Team[];
  onChange: (orderedCodes: string[]) => void;
}) {
  return (
    <SortableList
      initialItems={teams.map((t) => ({
        id: t.code,
        badge: t.code,
        label: t.name,
      }))}
      onChange={onChange}
    />
  );
}
