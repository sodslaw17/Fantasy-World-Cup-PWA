import { createServiceClient } from "@/lib/supabase/service";
import { SNAKE_PICKS } from "@/lib/draft";

export const metadata = { title: "Draft Preferences — WC26 Admin" };

export default async function AdminPreferencesPage() {
  const service = createServiceClient();

  const [{ data: profiles }, { data: prefs }, { data: teams }] = await Promise.all([
    service.from("profiles").select("id, display_name").order("display_name"),
    service.from("draft_preferences").select("*"),
    service.from("teams").select("fifa_code, name"),
  ]);

  const teamName: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

  const prefByProfile: Record<string, typeof prefs extends (infer T)[] | null ? T : never> =
    Object.fromEntries((prefs ?? []).map((p) => [p.profile_id, p]));

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gold mb-1">Draft Preferences</h1>
      <div className="rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs px-4 py-2 mb-5">
        ⚠ For admin use only — view a player&apos;s picks if they are unavailable during the draft.
      </div>

      <div className="space-y-4">
        {(profiles ?? []).map((profile) => {
          const pref = prefByProfile[profile.id];
          return (
            <div key={profile.id} className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-2">
              <p className="text-sm font-semibold">{profile.display_name}</p>

              {!pref ? (
                <p className="text-xs text-paper/40 italic">No preferences submitted yet.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-paper/50">Preferred position</p>
                      {pref.position_preferences?.length ? (
                        <ol className="space-y-0.5 mt-1">
                          {pref.position_preferences.map((n: number, i: number) => (
                            <li key={n} className="text-xs font-mono">
                              <span className="text-paper/40">{i + 1}. </span>
                              Position {n} — picks {SNAKE_PICKS[n]?.join(", ")}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="font-medium">
                          {pref.preferred_position
                            ? `Position ${pref.preferred_position} — picks ${SNAKE_PICKS[pref.preferred_position]?.join(", ")}`
                            : "No preference"}
                        </p>
                      )}
                    </div>
                  </div>

                  {pref.team_wishlist && pref.team_wishlist.length > 0 && (
                    <div>
                      <p className="text-xs text-paper/50 mb-1">Team wishlist</p>
                      <ol className="space-y-1">
                        {pref.team_wishlist.map((code: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-paper/40 w-4">{i + 1}.</span>
                            <span className="font-mono text-paper/50 w-8">{code}</span>
                            <span>{teamName[code] ?? code}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {pref.notes && (
                    <div>
                      <p className="text-xs text-paper/50">Notes</p>
                      <p className="text-paper/80 whitespace-pre-wrap text-xs bg-ink rounded p-2 mt-1">
                        {pref.notes}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-paper/30">
                    Updated {new Date(pref.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
