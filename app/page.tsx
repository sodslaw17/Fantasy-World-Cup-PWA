import { createClient } from "@/lib/supabase/server";
import { isAdmin, isSuperAdmin } from "@/lib/auth/roles";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const admin = isAdmin(email);
  const superAdmin = isSuperAdmin(email);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12 gap-6">
      {/* Wordmark */}
      <div className="text-center">
        <div className="text-5xl font-black tracking-tight">
          <span className="text-gold">WC</span>
          <span className="text-paper">26</span>
        </div>
        <p className="text-xs text-paper/50 uppercase tracking-widest mt-1">
          Fantasy Pool
        </p>
      </div>

      {/* Auth confirmation */}
      <div className="w-full max-w-sm rounded-xl bg-ink-soft border border-paper/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-green" />
          <span className="text-sm text-paper/70">Signed in</span>
        </div>
        <p className="text-sm font-medium truncate">{email}</p>
        {admin && (
          <span className="inline-block text-xs px-2 py-0.5 rounded bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
            Admin
          </span>
        )}
        {superAdmin && (
          <span className="inline-block text-xs px-2 py-0.5 rounded bg-accent-red/20 text-accent-red border border-accent-red/30 ml-1">
            Super Admin
          </span>
        )}
      </div>

      <p className="text-xs text-paper/30 text-center max-w-xs">
        Phase 0 scaffold — auth working. Prediction UI and leaderboards coming
        in the next phase.
      </p>

      {admin && (
        <Link
          href="/admin"
          className="text-sm text-gold underline underline-offset-4"
        >
          Go to Admin →
        </Link>
      )}
    </main>
  );
}
