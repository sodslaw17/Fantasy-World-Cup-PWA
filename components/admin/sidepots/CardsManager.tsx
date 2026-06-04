"use client";

import { useState } from "react";
import { saveMatchCards } from "@/app/admin/sidepots/actions";
import type { Match } from "@/lib/db";

interface MatchWithStats extends Match {
  homeTeamName: string;
  awayTeamName: string;
  homeStats: { yellows: number; second_yellows: number; straight_reds: number } | null;
  awayStats: { yellows: number; second_yellows: number; straight_reds: number } | null;
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

  const byStage = Object.keys(STAGE_LABELS).map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    matches: matches.filter((m) => m.stage === stage && m.status === "finished"),
  })).filter((s) => s.matches.length > 0);

  if (byStage.length === 0) {
    return (
      <p className="text-sm text-paper/40 py-6 text-center">
        No finished matches yet. Enter results first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-paper/50">
        Cards accumulated by drafted teams affect the 2nd Side Pot.
        1st yellow = 1 pt · 2nd yellow = 2 pts · straight red = 4 pts.
      </p>
      {byStage.map(({ stage, label, matches: stageMatches }) => (
        <div key={stage} className="space-y-3">
          <h3 className="text-xs font-medium text-paper/50 uppercase tracking-wide">{label}</h3>
          {stageMatches.map((match) => (
            <div key={match.id} className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-3">
              <p className="text-sm font-semibold text-center">
                {match.homeTeamName} {match.home_goals}–{match.away_goals} {match.awayTeamName}
              </p>
              {[
                { code: match.home_team_code!, name: match.homeTeamName, stats: match.homeStats },
                { code: match.away_team_code!, name: match.awayTeamName, stats: match.awayStats },
              ].map(({ code, name, stats }) => {
                const key = `${match.id}-${code}`;
                const msg = messages[key];
                return (
                  <form key={code} action={(fd) => handleSave(match.id, code, fd)}
                    className="space-y-2 border border-paper/10 rounded-lg p-3">
                    <p className="text-xs font-medium text-paper/70">{name}</p>
                    <div className="flex gap-2">
                      {[
                        { name: "yellows",       label: "1st Yellows", val: stats?.yellows ?? 0 },
                        { name: "second_yellows", label: "2nd Yellows", val: stats?.second_yellows ?? 0 },
                        { name: "straight_reds",  label: "Straight Reds", val: stats?.straight_reds ?? 0 },
                      ].map(({ name: fname, label, val }) => (
                        <div key={fname} className="flex-1 text-center">
                          <label className="text-xs text-paper/40 block mb-1">{label}</label>
                          <input name={fname} type="number" min={0} defaultValue={val}
                            className="w-full rounded-lg bg-ink border border-paper/20 px-2 py-1.5 text-sm text-center text-paper focus:outline-none focus:ring-1 focus:ring-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={saving === key}
                        className="rounded-lg bg-gold text-ink text-xs font-semibold px-4 py-1.5 disabled:opacity-50">
                        {saving === key ? "Saving…" : "Save"}
                      </button>
                      {msg && (
                        <span className={`text-xs ${msg === "Saved" ? "text-accent-green" : "text-accent-red"}`}>
                          {msg === "Saved" ? "✓" : msg}
                        </span>
                      )}
                    </div>
                  </form>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
