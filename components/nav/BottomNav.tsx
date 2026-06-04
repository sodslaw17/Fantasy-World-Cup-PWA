"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Phase } from "@/lib/phase";

export function BottomNav({ phase }: { phase: Phase }) {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  const showBracket = phase === "draft_standby" || phase === "knockout";

  const NAV = [
    { href: "/",        label: "Standings", icon: "🏆" },
    { href: "/today",   label: "Today",     icon: "📅" },
    showBracket
      ? { href: "/bracket", label: "Bracket",  icon: "🗂" }
      : { href: "/predict", label: "Predict",  icon: "⚽" },
    { href: "/payouts", label: "Payouts",   icon: "💰" },
    { href: "/rules",   label: "Rules",     icon: "📜" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-ink border-t border-paper/10 flex z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.map(({ href, label, icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-tap text-[10px] transition-colors ${
              active ? "text-gold" : "text-paper/40 hover:text-paper/70"
            }`}
          >
            <span className="text-lg leading-none mb-0.5">{icon}</span>
            <span className="font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
