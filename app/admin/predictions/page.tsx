import { createServiceClient } from "@/lib/supabase/service";
import { PredictionsManager } from "@/components/admin/PredictionsManager";
import { AdminPageHeader } from "../_components/AdminShell";
import type { Match, Prediction } from "@/lib/db";

export const metadata = { title: "Predictions — WC26 Admin" };

export default async function AdminPredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const { user: selectedProfileId } = await searchParams;
  const service = createServiceClient();

  const [
    { data: profiles },
    { data: allMatches },
    { data: teams },
  ] = await Promise.all([
    service.from("profiles").select("id, display_name, auth_id").order("display_name"),
    service.from("matches").select("*").eq("stage", "group").order("group_letter").order("kickoff_utc"),
    service.from("teams").select("fifa_code, name"),
  ]);

  const teamNames: Record<string, string> = Object.fromEntries(
    (teams ?? []).map((t) => [t.fifa_code, t.name])
  );

  const matches = (allMatches ?? [] as Match[]).map((m: Match) => ({
    id: m.id,
    group_letter: m.group_letter,
    kickoff_utc: m.kickoff_utc,
    homeTeamName: teamNames[m.home_team_code ?? ""] ?? m.home_team_code ?? "TBD",
    awayTeamName: teamNames[m.away_team_code ?? ""] ?? m.away_team_code ?? "TBD",
  }));

  const selectedProfile = (profiles ?? []).find((p) => p.id === selectedProfileId) ?? null;

  let existingPredictions: Record<string, { home: number; away: number }> = {};
  if (selectedProfile?.auth_id) {
    const { data: preds } = await service
      .from("predictions")
      .select("*")
      .eq("user_id", selectedProfile.auth_id);
    existingPredictions = Object.fromEntries(
      (preds ?? [] as Prediction[]).map((p: Prediction) => [
        p.match_id,
        { home: p.home_goals_pred, away: p.away_goals_pred },
      ])
    );
  }

  const users = (profiles ?? []).map((p) => ({
    profileId: p.id,
    displayName: p.display_name,
    authId: p.auth_id as string | null,
  }));

  return (
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader
        title="Predictions"
        sub="Enter group-stage predictions on behalf of a player"
      />
      <div className="px-4 pb-8">
        <p className="text-sm text-admin-muted mb-5">
          Users must have logged in at least once before predictions can be saved for them.
        </p>
        <PredictionsManager
          users={users}
          selectedProfileId={selectedProfileId ?? null}
          selectedAuthId={selectedProfile?.auth_id ?? null}
          matches={matches}
          existingPredictions={existingPredictions}
        />
      </div>
    </div>
  );
}
