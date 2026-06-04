"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface ActionResult { success?: boolean; error?: string; }

export async function saveDraftPreferences(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles").select("id").eq("auth_id", user.id).maybeSingle();
  if (!profile) return { error: "Profile not found" };

  const position = parseInt(formData.get("preferred_position") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  // Collect ranked team wishlist (up to 10 slots)
  const wishlist: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const code = (formData.get(`team_${i}`) as string)?.trim().toUpperCase();
    if (code) wishlist.push(code);
  }

  const { error } = await service.from("draft_preferences").upsert({
    profile_id: profile.id,
    preferred_position: position && position >= 1 && position <= 10 ? position : null,
    team_wishlist: wishlist.length > 0 ? wishlist : null,
    notes,
  }, { onConflict: "profile_id" });

  if (error) return { error: error.message };
  revalidatePath("/my-picks");
  return { success: true };
}
