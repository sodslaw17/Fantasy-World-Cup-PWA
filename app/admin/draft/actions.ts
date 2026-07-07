"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

interface ActionResult {
  success?: boolean;
  error?: string;
}

/** Replace all draft picks for one user. Pass empty array to clear. */
export async function setUserDraft(
  profileId: string,
  teamIds: string[]
): Promise<ActionResult> {
  if (teamIds.length > 3) return { error: "Maximum 3 teams per user." };

  const service = createServiceClient();

  // Check draft isn't locked
  const { data: settings } = await service
    .from("settings")
    .select("draft_locked")
    .single();
  if (settings?.draft_locked) return { error: "The draft is locked." };

  // Clear existing picks for this user, then insert new ones
  await service.from("drafts").delete().eq("profile_id", profileId);

  if (teamIds.length > 0) {
    const { error } = await service.from("drafts").insert(
      teamIds.map((teamId, i) => ({
        profile_id: profileId,
        team_id: teamId,
        pick_number: i + 1,
      }))
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/draft");
  revalidatePath("/my-team");
  return { success: true };
}

/** Unlock the draft so admins can reassign picks. */
export async function unlockDraft(): Promise<ActionResult> {
  const service = createServiceClient();
  const { error } = await service
    .from("settings")
    .update({ draft_locked: false })
    .eq("singleton", true);

  if (error) return { error: error.message };

  revalidatePath("/admin/draft");
  revalidatePath("/");
  return { success: true };
}

/** Lock the draft permanently. Cannot be undone. */
export async function lockDraft(): Promise<ActionResult> {
  const service = createServiceClient();
  const { error } = await service
    .from("settings")
    .update({ draft_locked: true })
    .eq("singleton", true);

  if (error) return { error: error.message };

  revalidatePath("/admin/draft");
  revalidatePath("/");
  return { success: true };
}
