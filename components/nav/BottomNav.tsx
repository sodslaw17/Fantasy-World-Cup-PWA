"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TabBar, type Tab } from "@/components/wc-ui";
import type { Phase } from "@/lib/phase";

export function BottomNav({ phase, isAdmin = false }: { phase: Phase; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  let middleTab: Tab;
  if (phase === "knockout") {
    middleTab = { id: "/bracket", label: "Bracket", icon: "bracket" };
  } else if (phase === "draft_standby") {
    middleTab = { id: "/my-picks", label: "Draft", icon: "predict" };
  } else {
    middleTab = { id: "/predict", label: "Predict", icon: "predict" };
  }

  const tabs: Tab[] = phase === "knockout"
    ? [
        { id: "/",         label: "Standings", icon: "standings" },
        { id: "/today",    label: "Today",     icon: "today" },
        { id: "/bracket",  label: "Bracket",   icon: "bracket" },
        { id: "/my-team",  label: "My Team",   icon: "predict" },
        { id: "/payouts",  label: "Payouts",   icon: "payouts" },
      ]
    : [
        { id: "/",         label: "Standings", icon: "standings" },
        { id: "/today",    label: "Today",     icon: "today" },
        middleTab,
        { id: "/payouts",  label: "Payouts",   icon: "payouts" },
        { id: "/rules",    label: "Rules",     icon: "rules" },
      ];

  const active = tabs.find((t) =>
    t.id === "/" ? pathname === "/" : pathname.startsWith(t.id)
  )?.id ?? null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center justify-center gap-1.5 w-full bg-brand-header/95 border-t border-line py-1.5 text-[11.5px] font-bold text-brand-header-on backdrop-blur-sm"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
          Admin Panel
        </Link>
      )}
      <TabBar
        tabs={tabs}
        active={active}
        onSelect={(id) => router.push(id)}
      />
    </nav>
  );
}
