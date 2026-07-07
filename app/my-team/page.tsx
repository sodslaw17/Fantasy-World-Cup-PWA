import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { MyTeamScreen, type DraftedTeam, type Efficiency } from "@/components/myteam/MyTeamScreen";
import { computeCardPoints } from "@/lib/scoring/sidepots";
import type { Match } from "@/lib/db";
import type { KnockoutMatch, PenaltyEvent } from "@/lib/scoring/knockout";

export const metadata = { title: "My Team — WC26 Pool" };

export default async function MyTeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const { data: profile } = await service
    .from("profiles")
    .select("id, display_name")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/");

  const [
    { data: drafts },
    { data: allMatches },
    { data: penaltyEvents },
    { data: effPick },
    { data: matchStats },
  ] = await Promise.all([
    service
      .from("drafts")
      .select("pick_number, teams(id, fifa_code, name, custom_icon_url)")
      .eq("profile_id", profile.id)
      .order("pick_number"),
    service.from("matches").select("*").neq("stage", "group").order("kickoff_utc"),
    service.from("penalty_events").select("*"),
    service
      .from("efficiency_picks")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle(),
    service.from("match_stats").select("team_code, yellows, second_yellows, straight_reds"),
  ]);

  const koMatches = (allMatches ?? []) as KnockoutMatch[];

  // Teams knocked out: lost a knockout match OR never made the knockout stage
  const knockoutParticipants = new Set<string>();
  const eliminatedCodes = new Set<string>();
  for (const m of koMatches) {
    if (m.home_team_code) knockoutParticipants.add(m.home_team_code);
    if (m.away_team_code) knockoutParticipants.add(m.away_team_code);
    if (m.home_goals == null || m.away_goals == null) continue;
    const winner = m.home_goals > m.away_goals ? m.home_team_code
      : m.away_goals > m.home_goals ? m.away_team_code
      : m.shootout_winner === 'home' ? m.home_team_code
      : m.shootout_winner === 'away' ? m.away_team_code
      : null;
    const loser = winner === m.home_team_code ? m.away_team_code
      : winner === m.away_team_code ? m.home_team_code : null;
    if (loser) eliminatedCodes.add(loser);
  }

  // Compute knockout points per team from penalty events + match results
  const draftedTeams: DraftedTeam[] = (drafts ?? []).map((d) => {
    const t = Array.isArray(d.teams) ? d.teams[0] : d.teams;
    const code = (t as { fifa_code: string } | null)?.fifa_code ?? "";
    const name = (t as { name: string } | null)?.name ?? code;
    const themeColor = undefined;
    const customIconUrl = (t as { custom_icon_url?: string | null } | null)?.custom_icon_url ?? null;

    // Knockout points: 3 per round won (approximate — count wins in matches)
    let pts = 0;
    let gd = 0;
    for (const m of koMatches) {
      const isHome = m.home_team_code === code;
      const isAway = m.away_team_code === code;
      if (!isHome && !isAway) continue;
      if (m.home_goals == null || m.away_goals == null) continue;
      const won = isHome ? m.home_goals > m.away_goals : m.away_goals > m.home_goals;
      if (won) pts += 3;
      gd += isHome ? (m.home_goals - m.away_goals) : (m.away_goals - m.home_goals);
    }

    // TODO(stub): penalty event deductions — wire to computeKnockoutPoints when available
    const penDed = (penaltyEvents ?? [])
      .filter((e: PenaltyEvent) => e.team_code === code)
      .reduce((sum: number, e: PenaltyEvent) => sum + (e.type === "panenka_score" ? 1 : e.type === "panenka_fail" ? -2 : -2), 0);
    pts += penDed;

    const cardPts = (matchStats ?? [])
      .filter((ms: { team_code: string }) => ms.team_code === code)
      .reduce((sum: number, ms: { yellows: number; second_yellows: number; straight_reds: number }) =>
        sum + computeCardPoints(ms.yellows, ms.second_yellows, ms.straight_reds), 0);

    return {
      code,
      name,
      themeColor,
      logoUrl: customIconUrl,
      customIconUrl: null,
      pts,
      gd: gd >= 0 ? `+${gd}` : `${gd}`,
      cardPts,
      eliminated: eliminatedCodes.has(code) || (knockoutParticipants.size > 0 && !knockoutParticipants.has(code)),
    };
  });

  const efficiency: Efficiency = {
    name: effPick?.player_name ?? "",
    iconUrl: effPick?.player_photo_url ?? null,
    g: effPick?.goals ?? 0,
    a: effPick?.assists ?? 0,
    min: effPick?.minutes ?? 0,
  };

  const effTeamCode = (effPick as { team_code?: string | null } | null)?.team_code ?? null;
  const effEliminated = effTeamCode
    ? eliminatedCodes.has(effTeamCode) || (knockoutParticipants.size > 0 && !knockoutParticipants.has(effTeamCode))
    : false;

  return (
    <MyTeamScreen
      userName={profile.display_name}
      teams={draftedTeams}
      efficiency={efficiency}
      effEliminated={effEliminated}
    />
  );
}
