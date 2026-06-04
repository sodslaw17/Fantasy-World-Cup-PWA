import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentPhase } from "@/lib/phase";
import { computeLeaderboard } from "@/lib/scoring/leaderboard";
import { computeOverallLeaderboard } from "@/lib/scoring/overall";
import { LeaderboardTable } from "@/components/standings/LeaderboardTable";
import { MyStatsCard } from "@/components/standings/MyStatsCard";
import { EfficiencyLeaderboard } from "@/components/standings/EfficiencyLeaderboard";
import { StandbyView } from "@/components/draft/StandbyView";
import { KnockoutHome } from "@/components/knockout/KnockoutHome";
import { isAdmin } from "@/lib/auth/roles";
import { computeEfficiencyLeaderboard } from "@/lib/scoring/sidepots";
import type { Settings, Match } from "@/lib/db";
import type { KnockoutMatch } from "@/lib/scoring/knockout";

export const metadata = { title: "WC26 Pool" };

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const admin = isAdmin(user.email ?? "");

  const [{ data: settings }, { data: profiles }, { data: allMatches }, { data: predictions }, { data: effPicks }] =
    await Promise.all([
      service.from("settings").select("*").single(),
      service.from("profiles").select("id, display_name, auth_id, avatar_url"),
      service.from("matches").select("*").order("kickoff_utc"),
      service.from("predictions").select("user_id, match_id, home_goals_pred, away_goals_pred"),
      service.from("efficiency_picks").select("*"),
    ]);

  const s = settings as Settings | null;
  const phase = s ? getCurrentPhase(s) : "predictions";
  const groupMatches = (allMatches ?? []).filter((m: Match) => m.stage === "group");
  const knockoutMatches = (allMatches ?? []).filter((m: Match) => m.stage !== "group");

  // ── Draft standby ──────────────────────────────────────────────────────────
  if (phase === "draft_standby") {
    const [{ data: myProfileRow }, { data: draftPrefs }, { data: teams }] = await Promise.all([
      service.from("profiles").select("id").eq("auth_id", user.id).maybeSingle(),
      service.from("draft_preferences").select("*"),
      service.from("teams").select("fifa_code, name"),
    ]);

    // My drafted teams (if draft locked)
    const myTeams: { teamName: string; fifaCode: string }[] = [];
    if (myProfileRow?.id) {
      const { data: myDrafts } = await service
        .from("drafts")
        .select("pick_number, teams(id, fifa_code, name)")
        .eq("profile_id", myProfileRow.id)
        .order("pick_number");
      for (const d of myDrafts ?? []) {
        const t = Array.isArray(d.teams) ? d.teams[0] : d.teams;
        if (t) myTeams.push({ teamName: t.name, fifaCode: t.fifa_code });
      }
    }

    // Group stage leaderboard (final standings)
    const groupLeaderboard = computeLeaderboard(
      profiles ?? [],
      groupMatches,
      predictions ?? []
    );

    // Team name lookup for wishlists
    const teamNameMap: Record<string, string> = Object.fromEntries(
      (teams ?? []).map((t: { fifa_code: string; name: string }) => [t.fifa_code, t.name])
    );

    // Draft preferences keyed by profile_id
    const prefByProfile: Record<string, { preferred_position: number | null; team_wishlist: string[] | null; notes: string | null }> =
      Object.fromEntries((draftPrefs ?? []).map((p) => [p.profile_id, p]));

    // Build per-user standby info (profile_id, name, avatar, leaderboard rank, pref)
    const standbyEntries = groupLeaderboard.map((e) => ({
      ...e,
      avatarUrl: (profiles ?? []).find((p: { auth_id: string | null }) => p.auth_id === e.authId) as { avatar_url: string | null } | undefined,
      pref: prefByProfile[e.profileId] ?? null,
    }));

    return (
      <StandbyView
        text={s?.draft_standby_text ?? "Standby for your draft picks."}
        myTeams={myTeams}
        draftLocked={s?.draft_locked ?? false}
        isAdmin={admin}
        leaderboard={standbyEntries}
        teamNameMap={teamNameMap}
        totalMatches={groupMatches.length}
        finishedMatches={groupMatches.filter((m: Match) => m.status === "finished").length}
      />
    );
  }

  // ── Knockout phase ─────────────────────────────────────────────────────────
  if (phase === "knockout") {
    const [{ data: drafts }, { data: teams }, { data: penaltyEvents }] = await Promise.all([
      service.from("drafts").select("profile_id, team_id, teams(fifa_code)"),
      service.from("teams").select("id, fifa_code, name, custom_icon_url"),
      service.from("penalty_events").select("match_id, team_code, type"),
    ]);

    // Flatten drafts to { profile_id, team_code }
    const draftRows = (drafts ?? []).map((d: { profile_id: string; team_id: string; teams: { fifa_code: string } | { fifa_code: string }[] | null }) => ({
      profile_id: d.profile_id,
      team_code: (Array.isArray(d.teams) ? d.teams[0]?.fifa_code : d.teams?.fifa_code) ?? "",
    }));

    const teamById: Record<string, { name: string; custom_icon_url: string | null }> =
      Object.fromEntries((teams ?? []).map((t: { id: string; name: string; custom_icon_url: string | null }) => [t.id, t]));
    const teamByCode: Record<string, { name: string; custom_icon_url: string | null }> =
      Object.fromEntries((teams ?? []).map((t: { fifa_code: string; name: string; custom_icon_url: string | null }) => [t.fifa_code, t]));

    // My profile → my drafted team codes
    const { data: myProfile } = await service
      .from("profiles").select("id").eq("auth_id", user.id).maybeSingle();
    const myDraftedCodes = draftRows
      .filter((d: { profile_id: string; team_code: string }) => d.profile_id === myProfile?.id)
      .map((d: { profile_id: string; team_code: string }) => d.team_code);

    // Overall leaderboard
    const overallBoard = computeOverallLeaderboard(
      profiles ?? [],
      groupMatches,
      predictions ?? [],
      draftRows,
      knockoutMatches.map((m: Match) => ({
        ...m,
        home_goals: m.home_goals ?? 0,
        away_goals: m.away_goals ?? 0,
      })) as KnockoutMatch[],
      penaltyEvents ?? []
    );

    const me = overallBoard.find((e) => e.authId === user.id);
    const leader = overallBoard[0];

    // Today's knockout matches
    const now = new Date();
    const startUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endUTC = new Date(startUTC.getTime() + 86_400_000);
    const todayKO = knockoutMatches
      .filter((m: Match) => {
        const k = new Date(m.kickoff_utc);
        return k >= startUTC && k < endUTC;
      })
      .map((m: Match) => ({
        ...m,
        homeTeamName: teamByCode[m.home_team_code ?? ""]?.name ?? m.home_team_code ?? "TBD",
        awayTeamName: teamByCode[m.away_team_code ?? ""]?.name ?? m.away_team_code ?? "TBD",
        homeIconUrl: teamByCode[m.home_team_code ?? ""]?.custom_icon_url,
        awayIconUrl: teamByCode[m.away_team_code ?? ""]?.custom_icon_url,
      }));

    return (
      <div className="min-h-screen pb-24">
        <header className="px-4 pt-5 pb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gold">WC26 Pool</h1>
          {admin && (
            <Link href="/admin"
              className="text-xs text-paper/40 hover:text-paper border border-paper/20 rounded-lg px-3 py-1.5">
              Admin
            </Link>
          )}
        </header>
        <div className="px-4 space-y-4">
          <KnockoutHome
            todayMatches={todayKO}
            myDraftedCodes={myDraftedCodes}
            me={me}
            leader={leader}
            totalPlayers={overallBoard.length}
          />
          {/* Overall leaderboard */}
          <h2 className="text-sm font-semibold text-paper/60 uppercase tracking-wide pt-2">
            Overall leaderboard
          </h2>
          <div className="space-y-2">
            {overallBoard.map((e) => (
              <div key={e.profileId}
                className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                  e.authId === user.id ? "bg-gold/10 border-gold/30" : "bg-ink-soft border-paper/10"
                }`}>
                <span className="w-6 text-sm font-bold text-paper/40 shrink-0 tabular-nums">
                  {e.rank}
                </span>
                <span className={`flex-1 text-sm font-semibold truncate ${e.authId === user.id ? "text-gold" : ""}`}>
                  {e.displayName}{e.authId === user.id && <span className="text-xs font-normal text-gold/60 ml-1">(you)</span>}
                </span>
                <div className="text-right text-xs text-paper/50 shrink-0">
                  <span className="font-bold text-sm text-paper tabular-nums">{e.totalPoints}</span>
                  <span className="ml-0.5">pts</span>
                  <span className="ml-2 tabular-nums">
                    GD {e.goalDifference >= 0 ? `+${e.goalDifference}` : e.goalDifference}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Group / predictions phase ──────────────────────────────────────────────
  const leaderboard = computeLeaderboard(profiles ?? [], groupMatches, predictions ?? []);
  const totalMatches = groupMatches.length;
  const finishedMatches = groupMatches.filter((m: Match) => m.status === "finished").length;
  const me = leaderboard.find((e) => e.authId === user.id);
  const leader = leaderboard[0];

  // Build profile avatar map
  const avatarByAuthId: Record<string, string | null> = Object.fromEntries(
    (profiles ?? []).map((p: { auth_id: string | null; avatar_url: string | null }) => [p.auth_id, p.avatar_url])
  );

  // Efficiency leaderboard data
  const effEntries = computeEfficiencyLeaderboard(
    (effPicks ?? []).map((p) => {
      const prof = (profiles ?? []).find((pr: { id: string }) => pr.id === p.profile_id);
      return {
        profileId: p.profile_id,
        displayName: (prof as { display_name?: string } | undefined)?.display_name ?? "Unknown",
        playerName: p.player_name,
        teamCode: p.team_code,
        goals: p.goals,
        assists: p.assists,
        minutes: p.minutes,
      };
    })
  ).map((e) => {
    const prof = (profiles ?? []).find((pr: { id: string }) => pr.id === e.profileId) as { auth_id: string | null; avatar_url: string | null } | undefined;
    return {
      ...e,
      userAvatarUrl: prof?.avatar_url ?? null,
      playerPhotoUrl: (effPicks ?? []).find((ep) => ep.profile_id === e.profileId)?.player_photo_url ?? null,
    };
  });

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gold">Standings</h1>
          <p className="text-xs text-paper/40">{finishedMatches} / {totalMatches} matches played</p>
        </div>
        {admin && (
          <Link href="/admin"
            className="text-xs text-paper/40 hover:text-paper border border-paper/20 rounded-lg px-3 py-1.5">
            Admin
          </Link>
        )}
      </header>

      {phase === "predictions" && (
        <div className="px-4 mb-4">
          <Link href="/predict"
            className="block w-full rounded-xl bg-gold text-ink font-bold text-center py-4 text-base active:scale-95 transition-transform">
            ⚽ Enter predictions →
          </Link>
        </div>
      )}

      <MyStatsCard me={me} leader={leader} totalPlayers={leaderboard.length} />
      <div className="px-4 space-y-2">
        <LeaderboardTable
          entries={leaderboard}
          currentAuthId={user.id}
          totalMatches={totalMatches}
          finishedMatches={finishedMatches}
        />
        {effEntries.length > 0 && (
          <EfficiencyLeaderboard entries={effEntries} />
        )}
        <div className="pt-2">
          <Link href="/payouts" className="text-xs text-paper/40 underline underline-offset-2">
            View full payouts summary →
          </Link>
        </div>
      </div>
    </div>
  );
}
