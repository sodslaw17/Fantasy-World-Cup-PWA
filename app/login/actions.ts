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
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    return {
      error:
        "That email isn't in the pool. Ask the organizer to add you first.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
