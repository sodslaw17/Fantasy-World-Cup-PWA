import { createServiceClient } from "@/lib/supabase/service";
import { PreferenceAccordion } from "@/components/admin/PreferenceAccordion";

export const metadata = { title: "Draft Preferences — WC26 Admin" };

export default async function AdminPreferencesPage() {
  const service = createServiceClient();

  const [{ data: profiles }, { data: prefs }, { data: teams }] = await Promise.all([
    service.from("profiles").select("id, display_name").order("display_name"),
    service.from("draft_preferences").select("*"),
    service.from("teams").select("fifa_code, name"),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

  const prefByProfile: Record<string, (typeof prefs extends (infer T)[] | null ? T : never)> =
    Object.fromEntries((prefs ?? []).map((p) => [p.profile_id, p]));

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gold mb-1">Draft Preferences</h1>
      <div className="rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs px-4 py-2 mb-5">
        ⚠ For admin use only — reveal a player&apos;s picks only if they are unavailable during the draft. Preferences are hidden by default.
      </div>

      <div className="space-y-2">
        {(profiles ?? []).map((profile) => (
          <PreferenceAccordion
            key={profile.id}
            displayName={profile.display_name}
            pref={prefByProfile[profile.id] ?? null}
            teamNames={teamNames}
          />
        ))}
      </div>
    </main>
  );
}
