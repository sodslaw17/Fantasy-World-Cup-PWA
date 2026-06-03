import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PredictionClient } from "@/components/predict/PredictionClient";
import type { Match, Team, Prediction, Settings } from "@/lib/db";

export const metadata = { title: "Predictions — WC26 Pool" };

export default async function PredictPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const [
    { data: matches },
    { data: teams },
    { data: myPredictions },
    { data: settings },
  ] = await Promise.all([
    service
      .from("matches")
      .select("*")
      .eq("stage", "group")
      .order("group_letter")
      .order("kickoff_utc"),
    service.from("teams").select("fifa_code, name"),
    service
      .from("predictions")
      .select("*")
      .eq("user_id", user.id),
    service.from("settings").select("*").single(),
  ]);

  // Build lookup maps
  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t: Pick<Team, "fifa_code" | "name">) => [t.fifa_code, t.name])
  );

  const predMap: Record<string, { home: number; away: number }> = Object.fromEntries(
    (myPredictions ?? []).map((p: Prediction) => [
      p.match_id,
      { home: p.home_goals_pred, away: p.away_goals_pred },
    ])
  );

  // Group matches by letter
  const grouped: Record<string, Match[]> = {};
  for (const m of (matches ?? []) as Match[]) {
    if (!m.group_letter) continue;
    (grouped[m.group_letter] ??= []).push(m);
  }

  const deadline = (settings as Settings | null)?.prediction_deadline_utc ?? null;
  const isLocked = deadline ? new Date() >= new Date(deadline) : false;

  return (
    <PredictionClient
      grouped={grouped}
      teamNames={teamNames}
      predMap={predMap}
      deadline={deadline}
      isLocked={isLocked}
    />
  );
}
