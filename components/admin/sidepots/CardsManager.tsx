"use client";

import { useState } from "react";
import { saveMatchCards } from "@/app/admin/sidepots/actions";
import { clearCardOverride } from "@/app/admin/sync/actions";
import type { Match } from "@/lib/db";

interface CardStats {
  yellows: number;
  second_yellows: number;
  straight_reds: number;
  yellows_auto: number;
  second_yellows_auto: number;
  straight_reds_auto: number;
  yellows_manual: number | null;
  second_yellows_manual: number | null;
  straight_reds_manual: number | null;
  last_synced_at: string | null;
}

interface MatchWithStats extends Match {
  homeTeamName: string;
  awayTeamName: string;
  homeStats: CardStats | null;
  awayStats: CardStats | null;
}

const STAGE_LABELS: Record<string, string> = {
  group: "Group Stage", r32: "Round of 32", r16: "Round of 16", qf: "Quarter-Finals",
  sf: "Semi-Finals", bronze: "Bronze Final", final: "Final",
};

export function CardsManager({ matches }: { matches: MatchWithStats[] }) {
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function handleSave(matchId: string, teamCode: string, fd: FormData) {
    const key = `${matchId}-${teamCode}`;
    setSaving(key);
    const result = await saveMatchCards(matchId, teamCode, fd);
    setSaving(null);
    setMessages((m) => ({ ...m, [key]: result.error ?? "Saved" }));
    setTimeout(() => setMessages((m) => ({ ...m, [key]: "" })), 3000);
  }

  async function handleClearOverride(matchId: string, teamCode: string) {
    const key = `${matchId}-${teamCode}`;
    setSaving(key);
    await clearCardOverride(matchId, teamCode);
    setSaving(null);
    setMessages((m) => ({ ...m, [key]: "Reset to API values" }));
    setTimeout(() => setMessages((m) => ({ ...m, [key]: "" })), 3000);
  }

  const now = new Date();
  const byStage = Object.keys(STAGE_LABELS).map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    matches: matches.filter(
      (m) => m.stage === stage && m.status === "finished" && new Date(m.kickoff_utc) <= now
    ),
  })).filter((s) => s.matches.length > 0);

  if (byStage.length === 0) {
    return (
      <p className="text-sm text-ink-3 py-6 text-center">
        No finished matches yet. Enter results first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-ink-2">
        Cards accumulated by drafted teams affect the 2nd Side Pot.
        1st yellow = 1 pt · 2nd yellow = 2 pts · straight red = 4 pts.
        Values in <span className="text-brand font-medium">blue</span> are from API auto-sync.
      </p>
      {byStage.map(({ stage, label, matches: stageMatches }) => (
        <div key={stage} className="space-y-3">
          <h3 className="text-xs font-medium text-ink-2 uppercase tracking-wide">{label}</h3>
          {stageMatches.map((match) => (
            <div key={match.id} className="rounded-xl bg-paper-2 border border-line p-4 space-y-3">
              <p className="text-sm font-semibold text-center">
                {match.homeTeamName} {match.home_goals}–{match.away_goals} {match.awayTeamName}
              </p>
              {[
                { code: match.home_team_code!, name: match.homeTeamName, stats: match.homeStats },
                { code: match.away_team_code!, name: match.awayTeamName, stats: match.awayStats },
              ].map(({ code, name, stats }) => {
                const key = `${match.id}-${code}`;
                const msg = messages[key];
                const hasAutoData = stats?.last_synced_at != null;
                const hasManualOverride =
                  stats?.yellows_manual != null ||
                  stats?.second_yellows_manual != null ||
                  stats?.straight_reds_manual != null;

                return (
                  <div key={code} className="border border-line rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-ink">{name}</p>
                      {hasAutoData && hasManualOverride && (
                        <button
                          onClick={() => handleClearOverride(match.id, code)}
                          disabled={saving === key}
                          className="text-[10px] text-ink-3 hover:text-brand underline disabled:opacity-50"
                        >
                          Reset to API
                        </button>
                      )}
                    </div>

                    {/* Auto values hint (shown when API data exists and differs from manual) */}
                    {hasAutoData && (
                      <p className="text-[10px] text-brand">
                        API: {stats!.yellows_auto}Y / {stats!.second_yellows_auto}2Y / {stats!.straight_reds_auto}R
                        {hasManualOverride && " (overridden)"}
                      </p>
                    )}

                    <form key={code} action={(fd) => handleSave(match.id, code, fd)} className="space-y-2">
                      <div className="flex gap-2">
                        {[
                          { name: "yellows",        label: "1st Yellows",  val: stats?.yellows        ?? 0 },
                          { name: "second_yellows", label: "2nd Yellows",  val: stats?.second_yellows ?? 0 },
                          { name: "straight_reds",  label: "Straight Reds", val: stats?.straight_reds  ?? 0 },
                        ].map(({ name: fname, label, val }) => (
                          <div key={fname} className="flex-1 text-center">
                            <label className="text-xs text-ink-3 block mb-1">{label}</label>
                            <input name={fname} type="number" min={0} defaultValue={val}
                              className="w-full rounded-lg bg-paper-2 border border-line-2 px-2 py-1.5 text-sm text-center text-ink focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="submit" disabled={saving === key}
                          className="rounded-lg bg-brand text-white text-xs font-semibold px-4 py-1.5 disabled:opacity-50">
                          {saving === key ? "Saving…" : "Save"}
                        </button>
                        {msg && (
                          <span className={`text-xs ${msg === "Saved" || msg.startsWith("Reset") ? "text-accent-green" : "text-accent-red"}`}>
                            {msg === "Saved" || msg.startsWith("Reset") ? `✓ ${msg}` : msg}
                          </span>
                        )}
                      </div>
                    </form>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
