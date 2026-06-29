import { createServiceClient } from "@/lib/supabase/service";
import { NicknamesClient } from "./_client";

export const metadata = { title: "Nicknames — Admin" };

export default async function NicknamesPage() {
  const service = createServiceClient();

  const [{ data: profiles }, { data: rawDrafts }, { data: teams }, { data: nicknames }] = await Promise.all([
    service.from("profiles").select("id, display_name").not("auth_id", "is", null).order("display_name"),
    service.from("drafts").select("profile_id, teams(fifa_code)"),
    service.from("teams").select("fifa_code, name"),
    service.from("pool_nicknames").select("profile_id, team_code, nickname, status"),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

  const drafts = (rawDrafts ?? [])
    .map((d) => {
      const t = Array.isArray(d.teams) ? d.teams[0] : d.teams;
      return { profile_id: d.profile_id as string, team_code: (t as { fifa_code?: string } | null)?.fifa_code ?? "" };
    })
    .filter((d) => d.team_code);

  const draftsByProfile: Record<string, string[]> = {};
  for (const d of drafts) (draftsByProfile[d.profile_id] ??= []).push(d.team_code);

  const nicknameMap: Record<string, Record<string, { nickname: string; status: string }>> = {};
  for (const n of nicknames ?? []) {
    const pid = n.profile_id as string;
    const code = (n.team_code as string) ?? "";
    if (!nicknameMap[pid]) nicknameMap[pid] = {};
    nicknameMap[pid][code] = { nickname: n.nickname as string, status: n.status as string };
  }

  const rows = (profiles ?? []).map((p) => ({
    profileId: p.id as string,
    displayName: p.display_name as string,
    userNickname: nicknameMap[p.id as string]?.[""] ?? null,
    teams: (draftsByProfile[p.id as string] ?? []).map((code) => ({
      code,
      name: teamNames[code] ?? code,
      nickname: nicknameMap[p.id as string]?.[code] ?? null,
    })),
  }));

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold mb-1">Pool Nicknames</h1>
      <p className="text-sm text-ink-2 mb-5">
        Nicknames are used in AI match summaries. Generate all at once, then edit any you want to tweak.
      </p>
      <NicknamesClient rows={rows} />
    </div>
  );
}
