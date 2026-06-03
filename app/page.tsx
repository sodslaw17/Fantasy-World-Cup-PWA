import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { computeLeaderboard } from "@/lib/scoring/leaderboard";
import { LeaderboardTable } from "@/components/standings/LeaderboardTable";
import { MyStatsCard } from "@/components/standings/MyStatsCard";
import { isAdmin } from "@/lib/auth/roles";
import type { Profile } from "@/lib/db";

export const metadata = { title: "Standings — WC26 Pool" };

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const [{ data: profiles }, { data: matches }, { data: predictions }] =
    await Promise.all([
      service.from("profiles").select("id, display_name, auth_id"),
      service
        .from("matches")
        .select("id, home_goals, away_goals, status")
        .eq("stage", "group"),
      service
        .from("predictions")
        .select("user_id, match_id, home_goals_pred, away_goals_pred"),
    ]);

  const leaderboard = computeLeaderboard(
    profiles ?? [],
    matches ?? [],
    predictions ?? []
  );

  const totalMatches = (matches ?? []).length;
  const finishedMatches = (matches ?? []).filter(
    (m) => m.status === "finished"
  ).length;

  const me = leaderboard.find((e) => e.authId === user.id);
  const leader = leaderboard[0];
  const admin = isAdmin(user.email ?? "");

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gold">Standings</h1>
          <p className="text-xs text-paper/40">
            {finishedMatches} / {totalMatches} matches played
          </p>
        </div>
        {admin && (
          <Link
            href="/admin"
            className="text-xs text-paper/40 hover:text-paper border border-paper/20 rounded-lg px-3 py-1.5"
          >
            Admin
          </Link>
        )}
      </header>

      <MyStatsCard
        me={me}
        leader={leader}
        totalPlayers={leaderboard.length}
      />

      <div className="px-4">
        <LeaderboardTable
          entries={leaderboard}
          currentAuthId={user.id}
          totalMatches={totalMatches}
          finishedMatches={finishedMatches}
        />
      </div>
    </div>
  );
}
