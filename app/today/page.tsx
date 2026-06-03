import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { TodayView, type TodayMatch, type UserPrediction } from "@/components/today/TodayView";
import type { Match, Prediction, Settings } from "@/lib/db";

export const metadata = { title: "Today — WC26 Pool" };

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  // Today in UTC
  const now = new Date();
  const startUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const endUTC = new Date(startUTC.getTime() + 86_400_000);

  const [
    { data: todayMatches },
    { data: teams },
    { data: allPredictions },
    { data: profiles },
    { data: settings },
  ] = await Promise.all([
    service
      .from("matches")
      .select("*")
      .eq("stage", "group")
      .gte("kickoff_utc", startUTC.toISOString())
      .lt("kickoff_utc", endUTC.toISOString())
      .order("kickoff_utc"),
    service.from("teams").select("fifa_code, name"),
    service.from("predictions").select("*"),
    service.from("profiles").select("id, display_name, auth_id"),
    service.from("settings").select("prediction_deadline_utc").single(),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

  const deadline = (settings as Settings | null)?.prediction_deadline_utc ?? null;
  const deadlinePassed = deadline ? now >= new Date(deadline) : false;

  // Index predictions: matchId → userId → pred
  const predIndex: Record<string, Record<string, Prediction>> = {};
  for (const pred of (allPredictions ?? []) as Prediction[]) {
    (predIndex[pred.match_id] ??= {})[pred.user_id] = pred;
  }

  // Build profile lookup: authId → displayName
  const profileByAuth: Record<string, string> = Object.fromEntries(
    (profiles ?? [])
      .filter((p) => p.auth_id)
      .map((p) => [p.auth_id!, p.display_name])
  );

  const enrichedMatches: TodayMatch[] = (todayMatches ?? []).map((m: Match) => {
    const matchPreds = predIndex[m.id] ?? {};
    const myPred = user.id in matchPreds ? matchPreds[user.id] : null;

    const others: UserPrediction[] = Object.entries(matchPreds)
      .filter(([uid]) => uid !== user.id)
      .map(([uid, pred]) => ({
        authId: uid,
        displayName: profileByAuth[uid] ?? "Unknown",
        homeGoalsPred: pred.home_goals_pred,
        awayGoalsPred: pred.away_goals_pred,
      }))
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

  const todayLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold text-gold">Today</h1>
        <p className="text-xs text-paper/50">{todayLabel}</p>
      </header>
      <div className="px-4">
        <TodayView
          matches={enrichedMatches}
          currentAuthId={user.id}
          deadlinePassed={deadlinePassed}
        />
      </div>
    </div>
  );
}
