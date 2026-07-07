"use client";
// Bridge between DraftPrefsScreen (handoff drag-to-rank UI) and
// the existing saveDraftPreferences server action (FormData-based).
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DraftPrefsScreen, type WishlistTeam } from "./DraftPrefsScreen";
import { saveDraftPreferences } from "@/app/my-picks/actions";

export function DraftPrefsClient({
  playerCount = 10,
  teams,
  savedPositionOrder,
}: {
  playerCount?: number;
  teams: WishlistTeam[];
  savedPositionOrder?: string[];
}) {
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  // Initialise from saved data so Done never overwrites with empty values
  const defaultPositions = Array.from({ length: playerCount }, (_, i) => `p${i + 1}`);
  const latestPositions = useRef<string[]>(savedPositionOrder ?? defaultPositions);
  const latestTeams = useRef<string[]>(teams.map((t) => t.code));

  function buildFormData() {
    const fd = new FormData();
    fd.set("position_preferences", latestPositions.current.map((k) => k.slice(1)).join(","));
    fd.set("team_wishlist", latestTeams.current.join(","));
    fd.set("notes", "");
    return fd;
  }

  function schedule() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraftPreferences(buildFormData()).catch(() => {});
    }, 800);
  }

  async function handleDone() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    await saveDraftPreferences(buildFormData()).catch(() => {});
    router.refresh();
    setSaving(false);
  }

  return (
    <DraftPrefsScreen
      playerCount={playerCount}
      teams={teams}
      initialPositionOrder={savedPositionOrder ?? defaultPositions}
      saving={saving}
      onPositionsChange={(order) => {
        latestPositions.current = order;
        schedule();
      }}
      onTeamsChange={(order) => {
        latestTeams.current = order;
        schedule();
      }}
      onDone={handleDone}
    />
  );
}
