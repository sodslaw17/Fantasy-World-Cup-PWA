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
    { data: allPredictions },
    { data: profiles },
    { data: settings },
  ] = await Promise.all([
    service
      .from("matches")
      .select("*")
      .eq("stage", "group")
      .order("group_letter")
      .order("kickoff_utc"),
    service.from("teams").select("fifa_code, name, custom_icon_url"),
    service.from("predictions").select("*"),
    service.from("profiles").select("id, display_name, auth_id, avatar_url"),
    service.from("settings").select("*").single(),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t: Pick<Team, "fifa_code" | "name">) => [t.fifa_code, t.name])
  );
  const teamLogoByCode: Record<string, string | null> = Object.fromEntries(
    (teams ?? []).map((t: { fifa_code: string; custom_icon_url?: string | null }) => [t.fifa_code, t.custom_icon_url ?? null])
  );

  // My predictions → predMap (for steppers)
  const predMap: Record<string, { home: number; away: number }> = Object.fromEntries(
    (allPredictions ?? [])
      .filter((p: Prediction) => p.user_id === user.id)
      .map((p: Prediction) => [p.match_id, { home: p.home_goals_pred, away: p.away_goals_pred }])
  );

  // Index all predictions: matchId → userId → pred
  const predIndex: Record<string, Record<string, Prediction>> = {};
  for (const pred of (allPredictions ?? []) as Prediction[]) {
    (predIndex[pred.match_id] ??= {})[pred.user_id] = pred;
  }

  // Profile lookup to show other users' names in the predict tab
  // My profile row (to identify self by id)
  const myProfileRow = (profiles ?? []).find((p) => p.auth_id === user.id);
  const otherProfiles = (profiles ?? []).filter((p) => p.id !== myProfileRow?.id);

  // Group matches by letter; attach others' predictions per match
  const grouped: Record<string, Match[]> = {};
  for (const m of (matches ?? []) as Match[]) {
    if (!m.group_letter) continue;
    (grouped[m.group_letter] ??= []).push(m);
  }

  // Build per-match others' predictions
  const othersByMatch: Record<string, { authId: string; displayName: string; avatarUrl: string | null; home: number | null; away: number | null }[]> = {};
  for (const m of (matches ?? []) as Match[]) {
    const matchPreds = predIndex[m.id] ?? {};
    othersByMatch[m.id] = otherProfiles
      .map((p) => {
        const pred = p.auth_id ? (matchPreds[p.auth_id] ?? null) : null;
        return {
          authId: p.auth_id ?? p.id,
          displayName: p.display_name,
          avatarUrl: (p as { avatar_url?: string | null }).avatar_url ?? null,
          home: pred?.home_goals_pred ?? null,
          away: pred?.away_goals_pred ?? null,
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  const deadline = (settings as Settings | null)?.prediction_deadline_utc ?? null;
  const isLocked = deadline ? new Date() >= new Date(deadline) : false;

  return (
    <PredictionClient
      grouped={grouped}
      teamNames={teamNames}
      teamLogoByCode={teamLogoByCode}
      predMap={predMap}
      othersByMatch={othersByMatch}
      deadline={deadline}
      isLocked={isLocked}
    />
  );
}
