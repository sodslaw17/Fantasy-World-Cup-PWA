"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function addUser(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const displayName = (formData.get("display_name") as string)?.trim();

  if (!email || !email.includes("@")) return { error: "Valid email required." };
  if (!displayName) return { error: "Display name required." };

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .insert({ email, display_name: displayName });

  if (error) {
    if (error.code === "23505") return { error: "That email is already in the pool." };
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateDisplayName(
  profileId: string,
  displayName: string
): Promise<ActionResult> {
  const name = displayName.trim();
  if (!name) return { error: "Display name cannot be empty." };

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ display_name: name })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(profileId: string): Promise<ActionResult> {
  const service = createServiceClient();

  // Fetch profile first so we can clean up orphaned predictions by auth_id
  const { data: profile } = await service
    .from("profiles")
    .select("auth_id")
    .eq("id", profileId)
    .maybeSingle();

  // Remove any predictions this user made (predictions FK is auth_id, not profile_id)
  if (profile?.auth_id) {
    await service.from("predictions").delete().eq("user_id", profile.auth_id);
  }

  const { error } = await service.from("profiles").delete().eq("id", profileId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
