"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function updateTeamIcon(
  teamId: string,
  iconUrl: string
): Promise<{ error?: string }> {
  const url = iconUrl.trim() || null;
  const service = createServiceClient();
  const { error } = await service
    .from("teams")
    .update({ custom_icon_url: url })
    .eq("id", teamId);
  if (error) return { error: error.message };
  revalidatePath("/admin/teams");
  revalidatePath("/");
  return {};
}
