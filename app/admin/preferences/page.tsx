import { createServiceClient } from "@/lib/supabase/service";
import { PreferenceAccordion } from "@/components/admin/PreferenceAccordion";
import { AdminPageHeader } from "../_components/AdminShell";
import { AlertBanner } from "../_components/ListPatterns";

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
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader
        title="Draft Preferences"
        sub="Admin-only — reveal only if a player is unavailable during the draft"
      />
      <div className="px-4 pb-8 space-y-4">
        <AlertBanner variant="warning">
          ⚠ For admin use only — reveal a player&apos;s picks only if they are unavailable during the draft. Preferences are hidden by default.
        </AlertBanner>

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
      </div>
    </div>
  );
}
