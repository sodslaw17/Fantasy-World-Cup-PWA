"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WaveStrip } from "@/components/wc-ui";

const NAV_ITEMS = [
  { href: "/admin",             label: "Dashboard"    },
  { href: "/admin/users",       label: "Users"        },
  { href: "/admin/draft",       label: "Draft"        },
  { href: "/admin/results",     label: "Match & Stats"},
  { href: "/admin/sidepots",    label: "Side Pots"    },
  { href: "/admin/teams",       label: "Assets"       },
  { href: "/admin/settings",    label: "Settings"     },
  { href: "/admin/sync",        label: "Live Sync"    },
  { href: "/admin/import",      label: "Import"       },
  { href: "/admin/predictions", label: "Predictions"  },
  { href: "/admin/preferences", label: "Draft Prefs"  },
  { href: "/admin/nicknames",   label: "Nicknames"    },
];

function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-0.5 overflow-x-auto" style={{ scrollbarWidth: "none" }} aria-label="Admin navigation">
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive =
          href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="whitespace-nowrap transition-colors min-h-[44px] flex items-center"
            style={{
              padding: "8px 12px",
              borderRadius: 9,
              fontSize: 13.5,
              fontWeight: isActive ? 800 : 600,
              color: isActive ? "var(--brand-ink)" : "var(--ink-2)",
              background: isActive ? "var(--brand-soft)" : "transparent",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper-2">
      <header className="bg-surface border-b border-line shrink-0">
        {/* Top row: brand + back link */}
        <div className="flex items-center gap-[18px] px-[26px] h-[52px]">
          <Link href="/admin" aria-label="Admin home" className="shrink-0">
            <span className="font-display font-bold uppercase tracking-[.04em] text-ink text-[18px]">WC26</span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-brand-on bg-brand rounded px-1.5 py-0.5">Admin</span>
          </Link>
          <Link
            href="/"
            className="shrink-0 inline-flex items-center gap-[5px] text-[12.5px] font-bold text-ink-2 transition-colors hover:text-ink min-h-[36px] px-2.5 rounded-[8px] hover:bg-paper-2"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            App
          </Link>
        </div>

        {/* Nav row: full width, own scroll container — no parent overflow interference */}
        <div className="relative border-t border-line">
          <div
            className="overflow-x-auto px-2 pb-1"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            <AdminNav />
          </div>
          {/* Right fade — signals more items off screen */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-12"
            style={{ background: "linear-gradient(to right, transparent, var(--surface))" }}
            aria-hidden="true"
          />
        </div>

        <WaveStrip height={5} intensity={1} />
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

/* Page-level header: font-display 30px uppercase title + subtitle + right-aligned actions */
export function AdminPageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="px-[26px] pt-[22px] pb-[18px] flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1
          className="m-0 font-display font-bold uppercase leading-none text-ink"
          style={{ fontSize: 30, letterSpacing: ".01em" }}
        >
          {title}
        </h1>
        {sub && (
          <div className="mt-2 text-[13.5px] font-medium text-ink-2 max-w-[660px] leading-[1.4]">{sub}</div>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-[10px] shrink-0">{actions}</div>
      )}
    </div>
  );
}
