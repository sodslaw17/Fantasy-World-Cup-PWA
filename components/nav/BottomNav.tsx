"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",        label: "Standings", icon: "🏆" },
  { href: "/today",   label: "Today",     icon: "📅" },
  { href: "/predict", label: "Predict",   icon: "⚽" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ink border-t border-paper/10 flex z-50"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {NAV.map(({ href, label, icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-tap text-xs transition-colors ${
              active ? "text-gold" : "text-paper/40 hover:text-paper/70"
            }`}
          >
            <span className="text-xl leading-none mb-0.5">{icon}</span>
            <span className="font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
