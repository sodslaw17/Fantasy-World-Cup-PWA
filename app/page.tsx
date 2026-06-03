import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { computeLeaderboard } from "@/lib/scoring/leaderboard";
import { getCurrentPhase } from "@/lib/phase";
import { LeaderboardTable } from "@/components/standings/LeaderboardTable";
import { MyStatsCard } from "@/components/standings/MyStatsCard";
import { StandbyView } from "@/components/draft/StandbyView";
import { isAdmin } from "@/lib/auth/roles";
import type { Settings } from "@/lib/db";

export const metadata = { title: "WC26 Pool" };

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const [{ data: settings }, { data: profiles }, { data: matches }, { data: predictions }] =
    await Promise.all([
      service.from("settings").select("*").single(),
      service.from("profiles").select("id, display_name, auth_id"),
      service.from("matches").select("id, home_goals, away_goals, status").eq("stage", "group"),
      service.from("predictions").select("user_id, match_id, home_goals_pred, away_goals_pred"),
    ]);

  const s = settings as Settings | null;
  const phase = s ? getCurrentPhase(s) : "predictions";
  const admin = isAdmin(user.email ?? "");

  // ── Draft standby phase ──────────────────────────────────────────────────
  if (phase === "draft_standby" || phase === "knockout") {
    // Fetch user's drafted teams
    const { data: myDrafts } = await service
      .from("drafts")
      .select("team_id, pick_number, teams(id, fifa_code, name)")
      .eq("profile_id",
        (await service.from("profiles").select("id").eq("auth_id", user.id).maybeSingle())
          ?.data?.id ?? ""
      )
      .order("pick_number");

    const myTeams = (myDrafts ?? [])
      .map((d) => {
        const t = Array.isArray(d.teams) ? d.teams[0] : d.teams;
        return t ? { teamName: t.name, fifaCode: t.fifa_code } : null;
      })
      .filter(Boolean) as { teamName: string; fifaCode: string }[];

    if (phase === "draft_standby") {
      return (
        <StandbyView
          text={s?.draft_standby_text ?? "Standby for your draft picks."}
          myTeams={myTeams}
          draftLocked={s?.draft_locked ?? false}
        />
      );
    }
    // knockout phase falls through to leaderboard for now (Phase 5 will add knockout home)
  }

  // ── Leaderboard (predictions + groups + knockout fallback) ───────────────
  const leaderboard = computeLeaderboard(
    profiles ?? [],
    matches ?? [],
    predictions ?? []
  );

  const totalMatches = (matches ?? []).length;
  const finishedMatches = (matches ?? []).filter((m) => m.status === "finished").length;

  const me = leaderboard.find((e) => e.authId === user.id);
  const leader = leaderboard[0];

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

      {/* CTA during predictions phase */}
      {phase === "predictions" && (
        <div className="px-4 mb-4">
          <Link
            href="/predict"
            className="block w-full rounded-xl bg-gold text-ink font-bold text-center py-4 text-base active:scale-95 transition-transform"
          >
            ⚽ Enter predictions →
          </Link>
        </div>
      )}

      <MyStatsCard me={me} leader={leader} totalPlayers={leaderboard.length} />

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
