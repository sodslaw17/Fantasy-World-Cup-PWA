import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { AdminPageHeader } from "./_components/AdminShell";
import { SectionCard, AlertBanner } from "./_components/ListPatterns";

export const metadata = { title: "Dashboard — WC26 Admin" };

async function getStats() {
  const service = createServiceClient();
  const [{ count: players }, { count: teams }, { count: fixtures }] =
    await Promise.all([
      service.from("profiles").select("*", { count: "exact", head: true }),
      service.from("teams").select("*",   { count: "exact", head: true }),
      service
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("stage", "group"),
    ]);
  return { players: players ?? 0, teams: teams ?? 0, fixtures: fixtures ?? 0 };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Players",         value: `${stats.players} / 10`, href: "/admin/users"  },
    { label: "Teams imported",  value: `${stats.teams} / 48`,   href: "/admin/import" },
    { label: "Fixtures loaded", value: `${stats.fixtures} / 72`, href: "/admin/import" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader title="Dashboard" sub="WC26 Fantasy Pool · Admin overview" />

      <div className="px-4 pb-8 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {cards.map(({ label, value, href }) => (
            <Link
              key={label}
              href={href}
              className="bg-white rounded-xl border border-admin-border p-4 hover:border-accent-blue/30 hover:shadow-card transition-all"
            >
              <div className="text-xl font-bold text-admin-ink">{value}</div>
              <div className="text-xs text-admin-muted mt-1">{label}</div>
            </Link>
          ))}
        </div>

        {/* Setup checklist */}
        <SectionCard className="p-4">
          <h2 className="text-sm font-semibold text-admin-ink mb-3">Setup checklist</h2>
          <ul className="space-y-2">
            <CheckItem done={stats.players > 0} label="Add players (Admin → Users)" />
            <CheckItem done={stats.teams === 48} label="Import 48 teams (Admin → Import → Teams)" />
            <CheckItem done={stats.fixtures === 72} label="Import 72 fixtures (Admin → Import → Fixtures)" />
          </ul>
        </SectionCard>

        {/* Coming up */}
        <SectionCard className="p-4">
          <h2 className="text-sm font-semibold text-admin-ink mb-2">Coming in later phases</h2>
          <ul className="text-xs text-admin-muted space-y-1">
            <li>Phase 3 — Prediction deadline + group scoring</li>
            <li>Phase 5 — Draft entry &amp; lock</li>
            <li>Phase 6 — Match result entry, knockout scoring</li>
            <li>Phase 7 — Side pots, penalty events, payouts</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
          done
            ? "bg-accent-green text-white"
            : "border-2 border-admin-border text-admin-muted"
        }`}
        aria-hidden="true"
      >
        {done ? "✓" : ""}
      </span>
      <span className={`text-sm ${done ? "line-through text-admin-muted" : "text-admin-ink"}`}>
        {label}
      </span>
    </li>
  );
}
