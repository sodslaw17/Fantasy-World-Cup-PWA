import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DraftPrefsForm } from "@/components/draft/DraftPrefsForm";

export const metadata = { title: "My Draft Picks — WC26 Pool" };

export default async function MyPicksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const { data: profile } = await service
    .from("profiles").select("id").eq("auth_id", user.id).maybeSingle();

  const [{ data: teams }, { data: prefs }] = await Promise.all([
    service.from("teams").select("fifa_code, name, group_letter").order("group_letter").order("name"),
    profile
      ? service.from("draft_preferences").select("*").eq("profile_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="min-h-screen pb-28">
      <header className="px-4 pt-5 pb-1">
        <h1 className="text-lg font-bold text-gold">My Draft Preferences</h1>
        <p className="text-xs text-paper/50 mt-1">
          Record your snake-draft position preference and team wishlist. These are
          for your own planning — admins can only access this if you are unavailable
          during the draft.
        </p>
      </header>
      <div className="px-4 mt-4">
        <DraftPrefsForm
          teams={teams ?? []}
          existing={prefs ?? null}
        />
      </div>
    </div>
  );
}
