import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { TodayView, type TodayMatch, type UserPrediction, type DrafterInfo } from "@/components/today/TodayView";
import type { Match, Prediction, Settings } from "@/lib/db";
import { isAdmin } from "@/lib/auth/roles";

export const metadata = { title: "Today — WC26 Pool" };

export default async function TodayPage() {
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

  // Compute today's UTC window in the user's local timezone so that browsing
  // in the evening doesn't flip to tomorrow's games.
  const now = new Date();
  const todayStr = now.toLocaleDateString("sv-SE", { timeZone: userTz });

  // Derive the UTC offset via Intl — reliable regardless of the server's own TZ.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: userTz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const p = (type: string) => parseInt(parts.find((x) => x.type === type)!.value);
  const localAsUTC = Date.UTC(p("year"), p("month") - 1, p("day"), p("hour") % 24, p("minute"), p("second"));
  const offsetMs = now.getTime() - localAsUTC;

  const startUTC = new Date(new Date(todayStr + "T00:00:00Z").getTime() + offsetMs);
  const endUTC = new Date(startUTC.getTime() + 86_400_000);

  const [
    { data: todayMatches },
    { data: teams },
    { data: allPredictions },
    { data: profiles },
    { data: settings },
    { data: allDrafts },
  ] = await Promise.all([
    service
      .from("matches")
      .select("*")
      .gte("kickoff_utc", startUTC.toISOString())
      .lt("kickoff_utc", endUTC.toISOString())
      .order("kickoff_utc"),
    service.from("teams").select("fifa_code, name"),
    service.from("predictions").select("*"),
    service.from("profiles").select("id, display_name, auth_id, avatar_url"),
    service.from("settings").select("prediction_deadline_utc").single(),
    service.from("drafts").select("profile_id, teams(fifa_code)"),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

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

  const adminUser = isAdmin(user.email ?? "");

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

  const enrichedMatches: TodayMatch[] = (todayMatches ?? []).map((m: Match) => {
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

    return {
      ...m,
      homeTeamName: teamNames[m.home_team_code ?? ""] ?? m.home_team_code ?? "TBD",
      awayTeamName: teamNames[m.away_team_code ?? ""] ?? m.away_team_code ?? "TBD",
      myPrediction: myPred
        ? { home: myPred.home_goals_pred, away: myPred.away_goals_pred }
        : null,
      otherPredictions: others,
    };
  });

  const todayLabel = now.toLocaleDateString("en-US", {
    timeZone: userTz,
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col h-dvh">
      <header className="bg-surface pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-end justify-between gap-3 px-5 pt-2.5 pb-3">
          <div className="min-w-0">
            <div className="text-ink-2 text-[13px] font-semibold mb-0.5 truncate">{todayLabel}</div>
            <h1 className="m-0 font-display font-bold uppercase tracking-[.005em] leading-none text-ink text-[28px]">
              Today
            </h1>
          </div>
        </div>
        <div className="h-px bg-line" />
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-3.5 py-3 pb-[calc(env(safe-area-inset-bottom)+74px)]">
          <TodayView
            matches={enrichedMatches}
            draftsByTeam={draftsByTeam}
            isAdmin={adminUser}
          />
        </div>
      </div>
    </div>
  );
}
