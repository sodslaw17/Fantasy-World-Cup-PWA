"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface SaveResult {
  success?: boolean;
  error?: string;
  locked?: boolean;
}

export async function savePrediction(
  matchId: string,
  homeGoals: number,
  awayGoals: number
): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Server-side deadline check — never trust the client clock
  const service = createServiceClient();
  const { data: settings } = await service
    .from("settings")
    .select("prediction_deadline_utc")
    .single();

  if (settings && new Date() >= new Date(settings.prediction_deadline_utc)) {
    return { locked: true, error: "The prediction deadline has passed." };
  }

  const { error } = await service.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_goals_pred: homeGoals,
      away_goals_pred: awayGoals,
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) return { error: error.message };
  return { success: true };
}
