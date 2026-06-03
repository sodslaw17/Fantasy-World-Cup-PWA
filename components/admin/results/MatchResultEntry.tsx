"use client";

import { useActionState, useState } from "react";
import { saveMatchResult, createKnockoutMatch } from "@/app/admin/results/actions";
import type { Match } from "@/lib/db";

const initState = { error: undefined as string | undefined, success: false };

// ── Single match result form ────────────────────────────────────────────────

export function MatchResultForm({ match, homeTeam, awayTeam }: {
  match: Match;
  homeTeam: string;
  awayTeam: string;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initState, fd: FormData) => {
      const r = await saveMatchResult(fd);
      return { error: r.error, success: r.success ?? false };
    },
    initState
  );

  const [shootout, setShootout] = useState(match.went_to_shootout);
  const isKnockout = match.stage !== "group";

  const kickoff = new Date(match.kickoff_utc).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="match_id" value={match.id} />

      {/* Teams + score inputs */}
      <div className="flex items-center gap-2">
        <span className="flex-1 text-right text-sm font-medium truncate">{homeTeam}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            name="home_goals"
            type="number" min={0} max={99}
            defaultValue={match.home_goals ?? ""}
            required
            className="w-12 h-10 rounded bg-ink border border-paper/20 text-center text-sm font-bold text-paper focus:outline-none focus:ring-1 focus:ring-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-paper/30 text-sm">–</span>
          <input
            name="away_goals"
            type="number" min={0} max={99}
            defaultValue={match.away_goals ?? ""}
            required
            className="w-12 h-10 rounded bg-ink border border-paper/20 text-center text-sm font-bold text-paper focus:outline-none focus:ring-1 focus:ring-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <span className="flex-1 text-left text-sm font-medium truncate">{awayTeam}</span>
      </div>

      <p className="text-xs text-paper/40 text-center">{kickoff}</p>

      {/* Knockout extras */}
      {isKnockout && (
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="hidden" name="went_to_et" value="false" />
            <input type="checkbox" name="went_to_et" value="true"
              defaultChecked={match.went_to_et}
              className="rounded" />
            Went to extra time
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="hidden" name="went_to_shootout" value="false" />
            <input type="checkbox" name="went_to_shootout" value="true"
              defaultChecked={match.went_to_shootout}
              onChange={e => setShootout(e.target.checked)}
              className="rounded" />
            Went to penalty shootout
          </label>
          {shootout && (
            <div className="flex gap-4 pl-6">
              {["home", "away"].map(side => (
                <label key={side} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="shootout_winner" value={side}
                    defaultChecked={match.shootout_winner === side}
                    required={shootout} />
                  {side === "home" ? homeTeam : awayTeam} won pens
                </label>
              ))}
            </div>
          )}
          {!shootout && <input type="hidden" name="shootout_winner" value="" />}
        </div>
      )}

      {!isKnockout && (
        <>
          <input type="hidden" name="went_to_et" value="false" />
          <input type="hidden" name="went_to_shootout" value="false" />
          <input type="hidden" name="shootout_winner" value="" />
        </>
      )}

      {state.error && <p className="text-xs text-accent-red">{state.error}</p>}

      <button
        type="submit" disabled={pending}
        className="w-full rounded-lg bg-gold text-ink text-sm font-semibold py-2 min-h-tap disabled:opacity-50"
      >
        {pending ? "Saving…" : match.status === "finished" ? "Update result" : "Save result"}
      </button>

      {state.success && (
        <p className="text-xs text-accent-green text-center">✓ Result saved</p>
      )}
    </form>
  );
}

// ── Group results tab ───────────────────────────────────────────────────────

export function GroupResultsTab({ groups }: {
  groups: Record<string, { match: Match; homeTeam: string; awayTeam: string }[]>;
}) {
  const letters = Object.keys(groups).sort();
  const [selected, setSelected] = useState(letters[0] ?? "A");
  const matches = groups[selected] ?? [];

  return (
    <div className="space-y-4">
      {/* Group selector */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {letters.map(g => (
          <button key={g} onClick={() => setSelected(g)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold ${
              selected === g ? "bg-gold text-ink" : "bg-ink-soft text-paper/60"
            }`}>
            {g}
          </button>
        ))}
      </div>

      {/* Matches */}
      <div className="space-y-3">
        {matches.map(({ match, homeTeam, awayTeam }) => (
          <div key={match.id} className="rounded-xl bg-ink-soft border border-paper/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                match.status === "finished"
                  ? "bg-accent-green/20 text-accent-green"
                  : "bg-paper/10 text-paper/40"
              }`}>
                {match.status === "finished" ? "✓ Done" : "Pending"}
              </span>
            </div>
            <MatchResultForm match={match} homeTeam={homeTeam} awayTeam={awayTeam} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Knockout results tab ────────────────────────────────────────────────────

const STAGES = [
  { value: "r32", label: "Round of 32" },
  { value: "r16", label: "Round of 16" },
  { value: "qf",  label: "Quarter-Finals" },
  { value: "sf",  label: "Semi-Finals" },
  { value: "bronze", label: "Bronze Final" },
  { value: "final",  label: "Final" },
];

export function KnockoutResultsTab({ matches, teamNames }: {
  matches: Match[];
  teamNames: Record<string, string>;
}) {
  const [createState, createAction, createPending] = useActionState(
    async (_prev: typeof initState, fd: FormData) => {
      const r = await createKnockoutMatch(fd);
      return { error: r.error, success: r.success ?? false };
    },
    initState
  );

  const byStage = STAGES.map(s => ({
    ...s,
    matches: matches.filter(m => m.stage === s.value),
  }));

  return (
    <div className="space-y-6">
      {/* Create new match */}
      <div className="rounded-xl bg-ink-soft border border-paper/10 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add knockout match</h3>
        <form action={createAction} className="space-y-3">
          <select name="stage" required
            className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-gold min-h-tap">
            <option value="">— select round —</option>
            {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="flex gap-2">
            <input name="home_team_code" type="text" placeholder="Home code (e.g. BRA)"
              className="flex-1 rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm font-mono text-paper placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-gold min-h-tap" />
            <span className="self-center text-paper/30 text-sm">vs</span>
            <input name="away_team_code" type="text" placeholder="Away code"
              className="flex-1 rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm font-mono text-paper placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-gold min-h-tap" />
          </div>
          <input name="kickoff_utc" type="text" placeholder="2026-06-28T22:00:00Z" required
            className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm font-mono text-paper placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-gold min-h-tap" />
          {createState.error && <p className="text-xs text-accent-red">{createState.error}</p>}
          {createState.success && <p className="text-xs text-accent-green">✓ Match created</p>}
          <button type="submit" disabled={createPending}
            className="w-full rounded-lg bg-gold text-ink text-sm font-semibold py-2.5 min-h-tap disabled:opacity-50">
            {createPending ? "Creating…" : "Add match"}
          </button>
        </form>
      </div>

      {/* Existing knockout matches by stage */}
      {byStage.filter(s => s.matches.length > 0).map(stage => (
        <div key={stage.value} className="space-y-3">
          <h3 className="text-xs text-paper/50 uppercase tracking-wide font-medium">
            {stage.label}
          </h3>
          {stage.matches.map(match => (
            <div key={match.id} className="rounded-xl bg-ink-soft border border-paper/10 p-4">
              <MatchResultForm
                match={match}
                homeTeam={teamNames[match.home_team_code ?? ""] ?? match.home_team_code ?? "TBD"}
                awayTeam={teamNames[match.away_team_code ?? ""] ?? match.away_team_code ?? "TBD"}
              />
            </div>
          ))}
        </div>
      ))}

      {matches.length === 0 && byStage.every(s => s.matches.length === 0) && (
        <p className="text-sm text-paper/40 text-center py-6">
          No knockout matches yet — add them above as teams qualify.
        </p>
      )}
    </div>
  );
}
