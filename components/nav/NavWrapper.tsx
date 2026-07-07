import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentPhase, type Phase } from "@/lib/phase";
import { isAdmin } from "@/lib/auth/roles";
import { BottomNav } from "./BottomNav";
import type { Settings } from "@/lib/db";

export async function NavWrapper() {
  let phase: Phase = "predictions";
  let adminUser = false;
  try {
    const [supabase, service] = [await createClient(), createServiceClient()];
    const [{ data: { user } }, { data: settings }] = await Promise.all([
      supabase.auth.getUser(),
      service.from("settings").select("*").single(),
    ]);
    if (user) adminUser = isAdmin(user.email ?? "");
    if (settings) phase = getCurrentPhase(settings as Settings);
  } catch {
    // fall through with defaults
  }
  return <BottomNav phase={phase} isAdmin={adminUser} />;
}
