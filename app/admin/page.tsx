import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";

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
    <main className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-lg font-bold text-gold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-3">
        {cards.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl bg-ink-soft border border-paper/10 p-4 hover:border-paper/20 transition-colors"
          >
            <div className="text-xl font-bold text-paper">{value}</div>
            <div className="text-xs text-paper/50 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-2">
        <h2 className="text-sm font-semibold">Setup checklist</h2>
        <ul className="space-y-1 text-sm text-paper/70">
          <CheckItem done={stats.players > 0} label="Add players (Admin → Players)" />
          <CheckItem done={stats.teams === 48} label="Import 48 teams (Admin → Import → Teams)" />
          <CheckItem done={stats.fixtures === 72} label="Import 72 fixtures (Admin → Import → Fixtures)" />
        </ul>
      </div>

      <div className="rounded-xl bg-ink-soft border border-paper/10 p-4">
        <h2 className="text-sm font-semibold mb-2">Coming in later phases</h2>
        <ul className="text-xs text-paper/40 space-y-1">
          <li>Phase 3 — Prediction deadline + group scoring</li>
          <li>Phase 5 — Draft entry &amp; lock</li>
          <li>Phase 6 — Match result entry, knockout scoring</li>
          <li>Phase 7 — Side pots, penalty events, payouts</li>
        </ul>
      </div>
    </main>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center text-xs shrink-0 ${
          done ? "bg-accent-green text-ink" : "border border-paper/20 text-paper/30"
        }`}
      >
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "line-through text-paper/30" : ""}>{label}</span>
    </li>
  );
}
