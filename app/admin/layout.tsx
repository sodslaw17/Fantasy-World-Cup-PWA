import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/roles";

const NAV = [
  { href: "/admin",           label: "Dashboard" },
  { href: "/admin/users",     label: "Players"   },
  { href: "/admin/import",    label: "Import"    },
  { href: "/admin/results",   label: "Results"   },
  { href: "/admin/draft",     label: "Draft"     },
  { href: "/admin/sidepots",  label: "Side Pots" },
  { href: "/admin/settings",  label: "Settings"  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email!)) redirect("/");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-paper/10 px-4 py-3 flex items-center gap-4 bg-ink-soft">
        <Link href="/admin" className="text-gold font-bold text-sm shrink-0">
          WC26 Admin
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-xs px-3 py-2 rounded-lg text-paper/60 hover:text-paper hover:bg-paper/5 whitespace-nowrap min-h-tap flex items-center"
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="ml-auto text-xs text-paper/40 hover:text-paper shrink-0"
        >
          ← App
        </Link>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
