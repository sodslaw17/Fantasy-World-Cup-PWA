import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentPhase, type Phase } from "@/lib/phase";
import { BottomNav } from "./BottomNav";
import type { Settings } from "@/lib/db";

export async function NavWrapper() {
  try {
    const service = createServiceClient();
    const { data: settings } = await service.from("settings").select("*").single();
    const phase: Phase = settings ? getCurrentPhase(settings as Settings) : "predictions";
    return <BottomNav phase={phase} />;
  } catch {
    return <BottomNav phase="predictions" />;
  }
}
