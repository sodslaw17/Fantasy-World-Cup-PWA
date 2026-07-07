"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function saveAdminPredictions(
  authId: string,
  predictions: Array<{ match_id: string; home: number; away: number }>
): Promise<{ error?: string; count?: number }> {
  if (!predictions.length) return { count: 0 };

  const service = createServiceClient();

  const rows = predictions.map((p) => ({
    user_id: authId,
    match_id: p.match_id,
    home_goals_pred: p.home,
    away_goals_pred: p.away,
  }));

  const { error } = await service
    .from("predictions")
    .upsert(rows, { onConflict: "user_id,match_id" });

  if (error) return { error: error.message };
  return { count: rows.length };
}
