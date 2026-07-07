// Vercel Cron handler + manual-trigger endpoint for live-data sync.
// Cron schedule: see vercel.json (default: every 15 minutes).
// Authorization: Bearer <CRON_SECRET> — Vercel sets this automatically for cron invocations.

import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // seconds

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const trigger = url.searchParams.get("trigger") === "manual" ? "manual" : "cron";

  try {
    const result = await runSync(trigger, force);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
