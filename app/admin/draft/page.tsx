import { createServiceClient } from "@/lib/supabase/service";
import { DraftManager } from "@/components/admin/DraftManager";
import type { Settings } from "@/lib/db";

export const metadata = { title: "Draft — WC26 Admin" };

export default async function DraftPage() {
  const service = createServiceClient();

  const [{ data: profiles }, { data: teams }, { data: drafts }, { data: settings }] =
    await Promise.all([
      service.from("profiles").select("id, display_name").order("display_name"),
      service.from("teams").select("id, fifa_code, name, group_letter").order("group_letter").order("name"),
      service.from("drafts").select("profile_id, team_id, pick_number"),
      service.from("settings").select("draft_locked").single(),
    ]);

  const draftLocked = (settings as Pick<Settings, "draft_locked"> | null)?.draft_locked ?? false;

  // Build team lookup
  const teamById: Record<string, { id: string; fifa_code: string; name: string; group_letter: string | null }> =
    Object.fromEntries((teams ?? []).map((t) => [t.id, t]));

  // Build picks per profile
  const picksByProfile: Record<string, typeof teams> = {};
  for (const d of drafts ?? []) {
    (picksByProfile[d.profile_id] ??= []).push(teamById[d.team_id]);
  }
  // Sort picks by pick_number
  for (const pid of Object.keys(picksByProfile)) {
    picksByProfile[pid] = (picksByProfile[pid] ?? []).sort(
      (a, b) =>
        (drafts?.find((d) => d.profile_id === pid && d.team_id === a?.id)
          ?.pick_number ?? 0) -
        (drafts?.find((d) => d.profile_id === pid && d.team_id === b?.id)
          ?.pick_number ?? 0)
    );
  }

  const players = (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    picks: (picksByProfile[p.id] ?? []).filter(Boolean),
  }));

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gold mb-1">Draft</h1>
      <p className="text-sm text-paper/50 mb-5">
        Assign 3 knockout teams per player, then lock the draft. Locked picks
        are shown to all users.
      </p>
      <DraftManager
        players={players}
        allTeams={teams ?? []}
        draftLocked={draftLocked}
      />
    </main>
  );
}
