import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback]", error?.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Link the Supabase auth user to the pre-approved profile row (first login only)
  const service = createServiceClient();
  await service
    .from("profiles")
    .update({ auth_id: data.user.id })
    .eq("email", data.user.email!)
    .is("auth_id", null);

  // Save timezone on first login (only if not already set)
  const tz = searchParams.get("tz");
  if (tz) {
    await service
      .from("profiles")
      .update({ timezone: tz })
      .eq("email", data.user.email!)
      .is("timezone", null);
  }

  const redirectTo = next.startsWith("/") ? `${origin}${next}` : origin;
  return NextResponse.redirect(redirectTo);
}
