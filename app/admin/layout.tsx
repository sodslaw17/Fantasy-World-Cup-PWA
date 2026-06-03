import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email!)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-paper/10 px-4 py-3 flex items-center gap-2">
        <span className="text-gold font-bold">WC26</span>
        <span className="text-paper/40">·</span>
        <span className="text-sm text-paper/70">Admin</span>
      </header>
      {children}
    </div>
  );
}
