import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  TodayView,
  type TodayMatch,
  type UserPrediction,
  type DrafterInfo,
  type EffPickForDisplay,
  type CommentaryData,
} from "@/components/today/TodayView";
import { DateNav } from "@/components/today/DateNav";
import type { Match, Prediction, Settings, CommentaryStatus, SassLevel } from "@/lib/db";
import { isAdmin } from "@/lib/auth/roles";
import { slotLabel, slotPrefix, type LabelNode } from "@/lib/bracket-label";
import { todayInTz, dateStrInTz, getUtcDayWindow, formatDayLabel } from "@/lib/date-window";

export const metadata = { title: "Today — WC26 Pool" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  // Fetch the user's profile to get their stored timezone
  const { data: myProfile } = await service
    .from("profiles")
    .select("timezone")
    .eq("auth_id", user.id)
    .maybeSingle();

  const userTz = myProfile?.timezone ?? "America/Chicago";

  // "Today" is computed fresh from the user's local timezone so browsing in the
  // evening doesn't flip to tomorrow's games. The selected day defaults to today
  // and is otherwise driven by ?d=YYYY-MM-DD (date navigation, swipe, etc.).
  const now = new Date();
  const todayStr = todayInTz(userTz, now);
  const { d: rawSelected } = await searchParams;
  const selectedStr = rawSelected && DATE_RE.test(rawSelected) ? rawSelected : todayStr;

  const { startUTC, endUTC } = getUtcDayWindow(selectedStr, userTz, now);

  const [
    { data: allMatches },
    { data: teams },
    { data: allPredictions },
    { data: profiles },
    { data: settings },
    { data: allDrafts },
    { data: rawEffPicks },
    { data: commentaryConfig },
  ] = await Promise.all([
    service.from("matches").select("*").order("kickoff_utc"),
    service.from("teams").select("fifa_code, name"),
    service.from("predictions").select("*"),
    service.from("profiles").select("id, display_name, auth_id, avatar_url"),
    service.from("settings").select("prediction_deadline_utc").single(),
    service.from("drafts").select("profile_id, teams(fifa_code)"),
    service.from("efficiency_picks").select("profile_id, player_name, team_code, player_photo_url"),
    service.from("commentary_config").select("sass_level").maybeSingle(),
  ]);

  const allMatchesList = (allMatches ?? []) as Match[];

  // Tournament date bounds (calendar days in the user's tz), so prev/next can't
  // page into empty months before/after the tournament. `allMatchesList` is
  // pre-sorted by kickoff_utc (query .order), so first/last are the extremes.
  const minDateStr = allMatchesList.length
    ? dateStrInTz(new Date(allMatchesList[0].kickoff_utc), userTz)
    : todayStr;
  const maxDateStr = allMatchesList.length
    ? dateStrInTz(new Date(allMatchesList[allMatchesList.length - 1].kickoff_utc), userTz)
    : todayStr;

  const todayMatches = allMatchesList.filter((m) => {
    const t = new Date(m.kickoff_utc).getTime();
    return t >= startUTC.getTime() && t < endUTC.getTime();
  });

  // Bracket-slot label index (winner/loser per KO match), so future knockout
  // fixtures whose teams aren't decided yet can show "Winner of X/Y" instead of
  // breaking. Built from ALL knockout matches, not just the selected day's —
  // mirrors app/bracket/page.tsx's winner/loser derivation exactly.
  const labelIdx: Record<string, LabelNode> = Object.fromEntries(
    allMatchesList
      .filter((m) => m.stage !== "group")
      .map((m) => {
        const decided = m.home_goals != null && m.away_goals != null;
        const winner = decided
          ? m.home_goals! > m.away_goals! ? m.home_team_code
          : m.away_goals! > m.home_goals! ? m.away_team_code
          : m.shootout_winner === "home" ? m.home_team_code
          : m.shootout_winner === "away" ? m.away_team_code
          : null
          : null;
        const loser = winner === m.home_team_code ? m.away_team_code
          : winner === m.away_team_code ? m.home_team_code
          : null;
        const node: LabelNode = {
          winner: winner ?? null,
          loser: loser ?? null,
          homeCode: m.home_team_code,
          awayCode: m.away_team_code,
          homeFeedId: m.home_feed_match_id,
          awayFeedId: m.away_feed_match_id,
          homeFeedOutcome: m.home_feed_outcome ?? "winner",
          awayFeedOutcome: m.away_feed_outcome ?? "winner",
        };
        return [m.id, node];
      })
  );

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

  // Undecided-slot placeholder, e.g. "Winner of Brazil / Argentina".
  function placeholderName(m: Match, side: "home" | "away"): string {
    const feedId = side === "home" ? m.home_feed_match_id : m.away_feed_match_id;
    const outcome = (side === "home" ? m.home_feed_outcome : m.away_feed_outcome) ?? "winner";
    const candidates = slotLabel(null, feedId, labelIdx, 0, outcome);
    const names = candidates === "?"
      ? "TBD"
      : candidates.split("/").map((c) => teamNames[c] ?? c).join(" / ");
    return `${slotPrefix(outcome)} ${names}`;
  }

  // Build profileId → {displayName, avatarUrl} for drafter lookup
  const profileById: Record<string, { displayName: string; avatarUrl: string | null }> =
    Object.fromEntries(
      (profiles ?? []).map((p) => [
        p.id,
        {
          displayName: p.display_name,
          avatarUrl: (p as { avatar_url?: string | null }).avatar_url ?? null,
        },
      ])
    );

  // Build teamCode → DrafterInfo (one drafter per team, enforced by DB unique constraint)
  const draftsByTeam: Record<string, DrafterInfo> = {};
  for (const draft of (allDrafts ?? []) as Record<string, unknown>[]) {
    const t = Array.isArray(draft.teams) ? draft.teams[0] : draft.teams;
    const code = (t as { fifa_code?: string } | null)?.fifa_code;
    const profileId = draft.profile_id as string;
    const prof = profileById[profileId];
    if (code && prof) {
      draftsByTeam[code] = { profileId, displayName: prof.displayName, avatarUrl: prof.avatarUrl };
    }
  }

  // Build efficiency picks list for display (team_code used to detect per-match involvement)
  const effPicks: EffPickForDisplay[] = (rawEffPicks ?? []).map((ep) => {
    const prof = profileById[ep.profile_id as string];
    return {
      profileId: ep.profile_id as string,
      displayName: prof?.displayName ?? "Unknown",
      playerName: ep.player_name as string,
      teamCode: ep.team_code as string | null,
      playerPhotoUrl: (ep as { player_photo_url?: string | null }).player_photo_url ?? null,
    };
  });

  // Fetch commentary for the selected day's knockout matches — commentary is
  // stored per match_id (not per day), so navigating to an already-played day
  // transparently reuses whatever was generated then; nothing regenerates here.
  const selectedKOMatchIds = todayMatches
    .filter((m: Match) => m.stage !== "group")
    .map((m: Match) => m.id);

  const commentaryRows =
    selectedKOMatchIds.length > 0
      ? (
          await service
            .from("match_commentary")
            .select("*")
            .in("match_id", selectedKOMatchIds)
        ).data ?? []
      : [];

  const commentary: Record<string, CommentaryData> = Object.fromEntries(
    commentaryRows.map((row) => [
      row.match_id,
      {
        matchId: row.match_id as string,
        pregameText: row.pregame_text as string | null,
        pregameStatus: (row.pregame_status as CommentaryStatus) ?? "none",
        pregameGeneratedAt: row.pregame_generated_at as string | null,
        postgameText: row.postgame_text as string | null,
        postgameStatus: (row.postgame_status as CommentaryStatus) ?? "none",
        postgameGeneratedAt: row.postgame_generated_at as string | null,
      },
    ])
  );

  const adminUser = isAdmin(user.email ?? "");
  const sassLevel = ((commentaryConfig as { sass_level?: string } | null)?.sass_level ?? "medium") as SassLevel;

  const deadline = (settings as Settings | null)?.prediction_deadline_utc ?? null;
  const deadlinePassed = deadline ? now >= new Date(deadline) : false;

  // Index predictions: matchId → userId → pred
  const predIndex: Record<string, Record<string, Prediction>> = {};
  for (const pred of (allPredictions ?? []) as Prediction[]) {
    (predIndex[pred.match_id] ??= {})[pred.user_id] = pred;
  }

  // My profile row (to exclude self by id, handles missing auth_id edge case)
  const myProfileRow = (profiles ?? []).find((p) => p.auth_id === user.id);

  // All profiles except the current user — include profiles without auth_id (show "No pick")
  const otherProfiles = (profiles ?? []).filter((p) => p.id !== myProfileRow?.id);

  const enrichedMatches: TodayMatch[] = todayMatches.map((m: Match) => {
    const matchPreds = predIndex[m.id] ?? {};
    const myPred = user.id in matchPreds ? matchPreds[user.id] : null;

    const others: UserPrediction[] = otherProfiles
      .map((p) => {
        // predictions.user_id = auth_id; profiles without auth_id never logged in → no prediction
        const pred = p.auth_id ? (matchPreds[p.auth_id] ?? null) : null;
        return {
          authId: p.auth_id ?? p.id,
          displayName: p.display_name,
          avatarUrl: (p as { avatar_url?: string | null }).avatar_url ?? null,
          homeGoalsPred: pred?.home_goals_pred ?? null,
          awayGoalsPred: pred?.away_goals_pred ?? null,
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Future knockout fixtures whose teams aren't decided yet show a bracket-style
    // placeholder ("Winner of Brazil / Argentina") instead of raw team codes/"TBD".
    const isKnockout = m.stage !== "group";
    const homeTeamName = m.home_team_code
      ? teamNames[m.home_team_code] ?? m.home_team_code
      : isKnockout ? placeholderName(m, "home") : "TBD";
    const awayTeamName = m.away_team_code
      ? teamNames[m.away_team_code] ?? m.away_team_code
      : isKnockout ? placeholderName(m, "away") : "TBD";

    return {
      ...m,
      homeTeamName,
      awayTeamName,
      myPrediction: myPred
        ? { home: myPred.home_goals_pred, away: myPred.away_goals_pred }
        : null,
      otherPredictions: others,
    };
  });

  const dayLabel = formatDayLabel(selectedStr);

  return (
    <div className="flex flex-col h-dvh">
      <header className="bg-surface pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-end justify-between gap-3 px-5 pt-2.5 pb-1">
          <div className="min-w-0">
            <h1 className="m-0 font-display font-bold uppercase tracking-[.005em] leading-none text-ink text-[28px]">
              Today
            </h1>
          </div>
        </div>
        <DateNav selected={selectedStr} today={todayStr} min={minDateStr} max={maxDateStr} label={dayLabel} />
        <div className="h-px bg-line" />
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-3.5 py-3 pb-[calc(env(safe-area-inset-bottom)+74px)]">
          <TodayView
            matches={enrichedMatches}
            draftsByTeam={draftsByTeam}
            isAdmin={adminUser}
            effPicks={effPicks}
            commentary={commentary}
            myProfileId={myProfileRow?.id ?? null}
            sassLevel={sassLevel}
          />
        </div>
      </div>
    </div>
  );
}
