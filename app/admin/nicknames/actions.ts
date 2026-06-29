"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/auth/roles";
import { generateCommentary } from "@/lib/llm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? "")) throw new Error("Unauthorized");
}

// ─── Generate all missing nicknames via LLM ────────────────────────────────────

export async function generateAllNicknames(): Promise<{ error?: string; generated?: number }> {
  try {
    await requireAdmin();
    const service = createServiceClient();

    const [{ data: profiles }, { data: rawDrafts }, { data: teams }] = await Promise.all([
      service.from("profiles").select("id, display_name").not("auth_id", "is", null),
      service.from("drafts").select("profile_id, teams(fifa_code)"),
      service.from("teams").select("fifa_code, name"),
    ]);

    const teamNames: Record<string, string> = Object.fromEntries(
      (teams ?? []).map((t) => [t.fifa_code, t.name]),
    );

    const drafts = (rawDrafts ?? [])
      .map((d) => {
        const t = Array.isArray(d.teams) ? d.teams[0] : d.teams;
        return { profile_id: d.profile_id as string, team_code: (t as { fifa_code?: string } | null)?.fifa_code ?? "" };
      })
      .filter((d) => d.team_code);

    const draftsByProfile: Record<string, string[]> = {};
    for (const d of drafts) (draftsByProfile[d.profile_id] ??= []).push(d.team_code);

    const profileList = (profiles ?? []).map((p) => ({
      profileId: p.id as string,
      displayName: p.display_name as string,
      teams: (draftsByProfile[p.id as string] ?? []).map((code) => ({
        code,
        name: teamNames[code] ?? code,
      })),
    }));

    const userPrompt = [
      "Generate fun, friendly, lightly sarcastic group-chat nicknames for each pool member.",
      "",
      "RULES:",
      "- Friendly-mean, never personally insulting",
      "- Base on their drafted team or football personality — not their real name",
      "- Under 4 words each",
      "- No offensive content",
      "- For team combos: a team-themed nickname playing off the country/club culture",
      "",
      "POOL MEMBERS:",
      ...profileList.map(
        (p) => `- ${p.displayName} (id: ${p.profileId}): drafted ${p.teams.map((t) => t.name).join(", ")}`,
      ),
      "",
      "OUTPUT: Valid JSON array ONLY — no other text, no code blocks:",
      `[`,
      `  {`,
      `    "profileId": "uuid-here",`,
      `    "userNickname": "nickname for this person",`,
      `    "teamNicknames": [`,
      `      { "teamCode": "BRA", "teamNickname": "The Samba Believers" }`,
      `    ]`,
      `  }`,
      `]`,
    ].join("\n");

    const systemPrompt =
      "You generate fun group-chat nicknames for a WC2026 fantasy football pool. Output valid JSON only — no explanation, no markdown, no code fences.";

    const raw = await generateCommentary(systemPrompt, userPrompt);

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```[\w]*\n?/m, "").replace(/```$/m, "").trim();

    let parsed: Array<{
      profileId: string;
      userNickname: string;
      teamNicknames: Array<{ teamCode: string; teamNickname: string }>;
    }>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { error: `LLM returned invalid JSON: ${cleaned.slice(0, 200)}` };
    }

    const rows: Array<{ profile_id: string; team_code: string; nickname: string; status: string }> = [];
    for (const p of parsed) {
      if (p.userNickname) {
        rows.push({ profile_id: p.profileId, team_code: "", nickname: p.userNickname, status: "generated" });
      }
      for (const t of p.teamNicknames ?? []) {
        if (t.teamNickname) {
          rows.push({ profile_id: p.profileId, team_code: t.teamCode, nickname: t.teamNickname, status: "generated" });
        }
      }
    }

    const { error } = await service.from("pool_nicknames").upsert(rows, { onConflict: "profile_id,team_code" });
    if (error) return { error: error.message };

    revalidatePath("/admin/nicknames");
    return { generated: rows.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Generation failed" };
  }
}

// ─── Save individual nickname ──────────────────────────────────────────────────

export async function saveNickname(
  profileId: string,
  teamCode: string,
  nickname: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const { error } = await service.from("pool_nicknames").upsert(
      { profile_id: profileId, team_code: teamCode, nickname: nickname.trim(), status: "edited", updated_at: new Date().toISOString() },
      { onConflict: "profile_id,team_code" },
    );
    if (error) return { error: error.message };
    revalidatePath("/admin/nicknames");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Save failed" };
  }
}

// ─── Delete individual nickname ────────────────────────────────────────────────

export async function deleteNickname(
  profileId: string,
  teamCode: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const service = createServiceClient();
    await service
      .from("pool_nicknames")
      .delete()
      .eq("profile_id", profileId)
      .eq("team_code", teamCode);
    revalidatePath("/admin/nicknames");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Delete failed" };
  }
}
