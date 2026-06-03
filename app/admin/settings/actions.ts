"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function saveSettings(formData: FormData): Promise<ActionResult> {
  const deadline = (formData.get("prediction_deadline_utc") as string)?.trim();
  const groupEnd = (formData.get("group_end_utc") as string)?.trim() || null;
  const knockoutStart = (formData.get("knockout_start_utc") as string)?.trim() || null;
  const standbyText = (formData.get("draft_standby_text") as string)?.trim();
  const phaseOverride = (formData.get("current_phase_override") as string)?.trim() || null;

  // Validate ISO-8601 dates
  for (const [label, val] of [
    ["Prediction deadline", deadline],
    ["Group end", groupEnd],
    ["Knockout start", knockoutStart],
  ] as const) {
    if (val && isNaN(Date.parse(val))) {
      return { error: `${label} is not a valid ISO-8601 date (e.g. 2026-06-11T19:00:00Z).` };
    }
  }

  const service = createServiceClient();
  const { error } = await service
    .from("settings")
    .update({
      prediction_deadline_utc: deadline,
      group_end_utc: groupEnd,
      knockout_start_utc: knockoutStart,
      draft_standby_text: standbyText,
      current_phase_override: phaseOverride,
    })
    .eq("singleton", true);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { success: true };
}
