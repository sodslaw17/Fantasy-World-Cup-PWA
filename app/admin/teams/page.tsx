import { createServiceClient } from "@/lib/supabase/service";
import { TeamIconManager } from "@/components/admin/TeamIconManager";
import { AdminPageHeader } from "../_components/AdminShell";

export const metadata = { title: "Assets — WC26 Admin" };

export default async function AdminTeamsPage() {
  const service = createServiceClient();
  const { data: teams } = await service
    .from("teams")
    .select("id, fifa_code, name, group_letter, custom_icon_url")
    .order("group_letter")
    .order("name");

  const grouped = (teams ?? []).reduce<
    Record<string, { id: string; fifaCode: string; name: string; iconUrl: string | null }[]>
  >((acc, t) => {
    const letter = t.group_letter ?? "?";
    (acc[letter] ??= []).push({
      id: t.id,
      fifaCode: t.fifa_code,
      name: t.name,
      iconUrl: t.custom_icon_url,
    });
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader
        title="Assets"
        sub="Custom knockout icons per team. Leave blank to show the FIFA code badge."
      />
      <div className="px-4 pb-8">
        <TeamIconManager groups={grouped} />
      </div>
    </div>
  );
}
