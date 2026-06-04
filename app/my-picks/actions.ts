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

  const notes = (formData.get("notes") as string)?.trim() || null;

  // Full ranked position preferences (comma-separated ints e.g. "3,1,7,2...")
  const posRaw = (formData.get("position_preferences") as string)?.trim();
  const positionPrefs = posRaw
    ? posRaw.split(",").map(Number).filter((n) => n >= 1 && n <= 10)
    : null;
  // Keep preferred_position as the top pick for backwards compat
  const position = positionPrefs?.[0] ?? null;

  // Full ranked team wishlist — all 48 codes in preferred order (comma-separated)
  const wishlistRaw = (formData.get("team_wishlist") as string)?.trim();
  const wishlist = wishlistRaw
    ? wishlistRaw.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean)
    : [];

  const { error } = await service.from("draft_preferences").upsert({
    profile_id: profile.id,
    preferred_position: position,
    position_preferences: positionPrefs,
    team_wishlist: wishlist.length > 0 ? wishlist : null,
    notes,
  }, { onConflict: "profile_id" });

  if (error) return { error: error.message };
  revalidatePath("/my-picks");
  return { success: true };
}
