import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentPhase, type Phase } from "@/lib/phase";
import { BottomNav } from "./BottomNav";
import type { Settings } from "@/lib/db";

export async function NavWrapper() {
  let phase: Phase = "predictions";
  try {
    const service = createServiceClient();
    const { data: settings } = await service.from("settings").select("*").single();
    if (settings) phase = getCurrentPhase(settings as Settings);
  } catch {
    // fall through with default phase
  }
  return <BottomNav phase={phase} />;
}
