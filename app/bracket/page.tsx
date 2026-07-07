import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { BracketScreen, type Bracket, type BracketRound } from "@/components/bracket/BracketScreen";
import type { Match } from "@/lib/db";
import { nameToColor } from "@/lib/name-color";
import { scoreKnockoutMatch } from "@/lib/scoring/knockout";
import type { KnockoutMatch } from "@/lib/scoring/knockout";

export const metadata = { title: "Bracket — WC26 Pool" };

const STAGE_ORDER = ["r32", "r16", "qf", "sf", "final"] as const;
const STAGE_META: Record<string, { label: string; short: string }> = {
  r32:    { label: "Round of 32",    short: "R32"   },
  r16:    { label: "Round of 16",    short: "R16"   },
  qf:     { label: "Quarter-Finals", short: "QF"    },
  sf:     { label: "Semi-Finals",    short: "SF"    },
  final:  { label: "Final",          short: "F"     },
  bronze: { label: "Bronze Final",   short: "3rd"   },
};

export default async function BracketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const [{ data: matches }, { data: teams }, { data: profiles }, { data: drafts }] =
    await Promise.all([
      service.from("matches").select("*").neq("stage", "group").order("kickoff_utc"),
      service.from("teams").select("fifa_code, name, custom_icon_url"),
      service.from("profiles").select("id, auth_id, display_name, avatar_url"),
      service.from("drafts").select("profile_id, team_id, teams(fifa_code)"),
    ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t: { fifa_code: string; name: string }) => [t.fifa_code, t.name])
  );
  const teamLogoByCode: Record<string, string | null> = Object.fromEntries(
    (teams ?? []).map((t: { fifa_code: string; custom_icon_url?: string | null }) => [t.fifa_code, t.custom_icon_url ?? null])
  );

  // Team → owner info (name, color, avatarUrl)
  type ProfileRow = { id: string; auth_id: string | null; display_name: string; avatar_url: string | null };
  type DraftRow = { profile_id: string; team_id: string; teams: { fifa_code: string } | { fifa_code: string }[] | null };
  const profileById = Object.fromEntries((profiles ?? [] as ProfileRow[]).map((p: ProfileRow) => [p.id, p]));
  const teamOwners: Record<string, { name: string; color: string; avatarUrl: string | null }> = {};
  for (const d of (drafts ?? [] as DraftRow[]) as DraftRow[]) {
    const code = (Array.isArray(d.teams) ? d.teams[0]?.fifa_code : (d.teams as { fifa_code: string } | null)?.fifa_code) ?? "";
    const prof = profileById[d.profile_id] as ProfileRow | undefined;
    if (code && prof) {
      teamOwners[code] = {
        name: prof.display_name,
        color: nameToColor(prof.display_name),
        avatarUrl: prof.avatar_url ?? null,
      };
    }
  }

  // Points earned per match per team code (finished matches only)
  const matchPoints: Record<string, Record<string, number>> = {};
  for (const m of (matches ?? []) as Match[]) {
    if (m.home_goals == null || m.away_goals == null) continue;
    const km = m as unknown as KnockoutMatch;
    const pts: Record<string, number> = {};
    if (m.home_team_code) pts[m.home_team_code] = scoreKnockoutMatch(km, m.home_team_code);
    if (m.away_team_code) pts[m.away_team_code] = scoreKnockoutMatch(km, m.away_team_code);
    matchPoints[m.id] = pts;
  }

  // My profile → drafted codes
  const myProfile = (profiles ?? []).find((p: { auth_id: string | null }) => p.auth_id === user.id);
  const myTeams: string[] = myProfile
    ? (drafts ?? [])
        .filter((d: { profile_id: string }) => d.profile_id === myProfile.id)
        .map((d: { teams: { fifa_code: string } | { fifa_code: string }[] | null }) =>
          (Array.isArray(d.teams) ? d.teams[0]?.fifa_code : d.teams?.fifa_code) ?? ""
        )
        .filter(Boolean)
    : [];

  // Group matches by stage
  const byStage: Record<string, Match[]> = {};
  for (const m of (matches ?? []) as Match[]) {
    (byStage[m.stage] ??= []).push(m);
  }

  // Build Bracket tree.
  // Slots: string (known code) | { win: matchId } (winner feeds slot) | { lose: matchId } (loser feeds slot) | null
  const slot = (code: string | null, feedId: string | null, outcome: 'winner' | 'loser' = 'winner') =>
    code ? code : feedId ? (outcome === 'loser' ? { lose: feedId } : { win: feedId }) : null;

  const hasBronze = (byStage["bronze"]?.length ?? 0) > 0;
  const allStages = hasBronze ? [...STAGE_ORDER, "bronze"] : [...STAGE_ORDER];
  const rounds: BracketRound[] = allStages.map((stageId) => {
    const meta = STAGE_META[stageId] ?? { label: stageId, short: stageId };
    const stageMatches = byStage[stageId] ?? [];
    return {
      id: stageId,
      label: meta.label,
      short: meta.short,
      matches: stageMatches.map((m) => {
        const decided = m.home_goals != null && m.away_goals != null;
        const winner = decided
          ? m.home_goals! > m.away_goals! ? (m.home_team_code ?? undefined)
          : m.away_goals! > m.home_goals! ? (m.away_team_code ?? undefined)
          : m.shootout_winner === "home" ? (m.home_team_code ?? undefined)
          : m.shootout_winner === "away" ? (m.away_team_code ?? undefined)
          : undefined
          : undefined;
        const loser = winner === m.home_team_code ? (m.away_team_code ?? undefined)
          : winner === m.away_team_code ? (m.home_team_code ?? undefined)
          : undefined;
        return {
          id: m.id,
          home: slot(m.home_team_code, m.home_feed_match_id, m.home_feed_outcome ?? 'winner'),
          away: slot(m.away_team_code, m.away_feed_match_id, m.away_feed_outcome ?? 'winner'),
          result: decided ? { h: m.home_goals!, a: m.away_goals! } : undefined,
          winner,
          loser,
        };
      }),
    };
  });

  const bracket: Bracket = { rounds };

  return (
    <BracketScreen
      bracket={bracket}
      teamNames={teamNames}
      teamLogoByCode={teamLogoByCode}
      teamOwners={teamOwners}
      matchPoints={matchPoints}
      myTeams={myTeams}
    />
  );
}
