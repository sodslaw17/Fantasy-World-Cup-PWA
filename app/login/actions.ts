"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const raw = formData.get("email");
  if (typeof raw !== "string" || !raw.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  const email = raw.trim().toLowerCase();

  // Hard gate: only pre-approved emails can request a magic link
  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("email, timezone")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    return {
      error:
        "That email isn't in the pool. Ask the organizer to add you first.",
    };
  }

  // Build redirect URL — include tz param only on first login (profile has no timezone yet)
  const base = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  const tz = formData.get("timezone");
  const redirectTo =
    !profile.timezone && typeof tz === "string" && tz
      ? `${base}?tz=${encodeURIComponent(tz)}`
      : base;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
