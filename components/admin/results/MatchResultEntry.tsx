"use client";

import { useActionState, useState, useTransition } from "react";
import { saveMatchResult, createKnockoutMatch, setMatchFeeds } from "@/app/admin/results/actions";
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
            className="w-12 h-10 rounded bg-paper-2 border border-line-2 text-center text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-ink-3 text-sm">–</span>
          <input
            name="away_goals"
            type="number" min={0} max={99}
            defaultValue={match.away_goals ?? ""}
            required
            className="w-12 h-10 rounded bg-paper-2 border border-line-2 text-center text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <span className="flex-1 text-left text-sm font-medium truncate">{awayTeam}</span>
      </div>

      <p className="text-xs text-ink-3 text-center">{kickoff}</p>

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
      {/* Note: card entry for this match is in Admin → Side Pots → Cards */}
      <p className="text-xs text-ink-3 text-center">
        Enter cards in <span className="font-medium">Admin → Side Pots → Cards</span>
      </p>

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
              selected === g ? "bg-gold text-ink" : "bg-paper-2 text-ink-2"
            }`}>
            {g}
          </button>
        ))}
      </div>

      {/* Matches */}
      <div className="space-y-3">
        {matches.map(({ match, homeTeam, awayTeam }) => (
          <div key={match.id} className="rounded-xl bg-paper-2 border border-line p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                match.status === "finished"
                  ? "bg-accent-green/20 text-accent-green"
                  : "bg-paper/10 text-ink-3"
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

// Which stage feeds into which (for the bracket wiring dropdowns)
const FEED_STAGE: Record<string, string> = {
  r16: "r32", qf: "r16", sf: "qf", final: "sf", bronze: "sf",
};

const STAGE_SHORT: Record<string, string> = {
  r32: "R32", r16: "R16", qf: "QF", sf: "SF", final: "F", bronze: "3rd",
};

function matchOptionLabel(m: Match, teamNames: Record<string, string>) {
  const home = m.home_team_code ? (teamNames[m.home_team_code] ?? m.home_team_code) : "TBD";
  const away = m.away_team_code ? (teamNames[m.away_team_code] ?? m.away_team_code) : "TBD";
  return `${STAGE_SHORT[m.stage] ?? m.stage} · ${home} vs ${away}`;
}

// ── Bracket wiring section ─────────────────────────────────────────────────

function BracketWiringSection({ matches, teamNames }: { matches: Match[]; teamNames: Record<string, string> }) {
  const [pending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, { home: string; away: string }>>({});
  const [open, setOpen] = useState(false);

  const wirableStages = ["r16", "qf", "sf", "final", "bronze"];
  const wirableMatches = matches.filter((m) => wirableStages.includes(m.stage));

  if (wirableMatches.length === 0) return null;

  function getDraft(matchId: string, m: Match) {
    return drafts[matchId] ?? {
      home: m.home_feed_match_id ?? "",
      away: m.away_feed_match_id ?? "",
    };
  }

  function handleSave(m: Match) {
    const { home, away } = getDraft(m.id, m);
    startTransition(async () => {
      const result = await setMatchFeeds(m.id, home || null, away || null);
      setMessages((prev) => ({ ...prev, [m.id]: result.error ?? "Saved" }));
      setTimeout(() => setMessages((prev) => ({ ...prev, [m.id]: "" })), 3000);
    });
  }

  return (
    <div className="rounded-xl bg-paper-2 border border-line overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-ink hover:bg-paper-2/80 transition-colors"
      >
        <span>Bracket wiring (path-to-final feeds)</span>
        <span className="text-ink-3 text-lg leading-none">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-line divide-y divide-line">
          <p className="px-4 py-2.5 text-xs text-ink-2">
            For each R16–Final match, select which earlier match's winner fills each slot.
            Once wired, tapping a team in the bracket traces its full path to the Final.
          </p>
          {wirableStages.flatMap((stageId) => {
            const feedStage = FEED_STAGE[stageId];
            const feedCandidates = matches.filter((m) => m.stage === feedStage);
            const stageMatches = wirableMatches.filter((m) => m.stage === stageId);
            if (stageMatches.length === 0) return [];
            return stageMatches.map((m) => {
              const draft = getDraft(m.id, m);
              const msg = messages[m.id];
              return (
                <div key={m.id} className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-ink">{matchOptionLabel(m, teamNames)}</p>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-ink-3 uppercase tracking-wide">Home slot feeds from</label>
                      <select
                        value={draft.home}
                        onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: { ...getDraft(m.id, m), home: e.target.value } }))}
                        className="w-full rounded-lg bg-paper-2 border border-line-2 px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                      >
                        <option value="">— none —</option>
                        {feedCandidates.map((fc) => (
                          <option key={fc.id} value={fc.id}>{matchOptionLabel(fc, teamNames)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-ink-3 uppercase tracking-wide">Away slot feeds from</label>
                      <select
                        value={draft.away}
                        onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: { ...getDraft(m.id, m), away: e.target.value } }))}
                        className="w-full rounded-lg bg-paper-2 border border-line-2 px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                      >
                        <option value="">— none —</option>
                        {feedCandidates.map((fc) => (
                          <option key={fc.id} value={fc.id}>{matchOptionLabel(fc, teamNames)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="shrink-0 pb-0.5">
                      <button
                        onClick={() => handleSave(m)}
                        disabled={pending}
                        className="rounded-lg bg-brand text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50"
                      >
                        {pending ? "…" : "Set"}
                      </button>
                    </div>
                  </div>
                  {msg && (
                    <p className={`text-xs ${msg === "Saved" ? "text-accent-green" : "text-accent-red"}`}>
                      {msg === "Saved" ? "✓ Saved" : msg}
                    </p>
                  )}
                </div>
              );
            });
          })}
        </div>
      )}
    </div>
  );
}

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
      <div className="rounded-xl bg-paper-2 border border-line p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add knockout match</h3>
        <form action={createAction} className="space-y-3">
          <select name="stage" required
            className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand min-h-tap">
            <option value="">— select round —</option>
            {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="flex gap-2">
            <input name="home_team_code" type="text" placeholder="Home code (optional if feed set)"
              className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand min-h-tap" />
            <span className="self-center text-ink-3 text-sm">vs</span>
            <input name="away_team_code" type="text" placeholder="Away code"
              className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand min-h-tap" />
          </div>
          <input name="kickoff_utc" type="text" placeholder="2026-06-28T22:00:00Z" required
            className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand min-h-tap" />

          {/* Optional bracket feed wiring (for path-to-final path tracing) */}
          {matches.length > 0 && (
            <details className="text-xs">
              <summary className="text-ink-2 cursor-pointer select-none py-1">
                Bracket progression (optional — set feed matches for path tracing)
              </summary>
              <div className="pt-2 space-y-2">
                <div className="space-y-1">
                  <label className="text-ink-3">Home slot winner comes from</label>
                  <select name="home_feed_match_id"
                    className="w-full rounded-lg bg-paper-2 border border-line-2 px-2 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand">
                    <option value="">— none —</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>{matchOptionLabel(m, teamNames)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-ink-3">Away slot winner comes from</label>
                  <select name="away_feed_match_id"
                    className="w-full rounded-lg bg-paper-2 border border-line-2 px-2 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand">
                    <option value="">— none —</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>{matchOptionLabel(m, teamNames)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </details>
          )}

          {createState.error && <p className="text-xs text-accent-red">{createState.error}</p>}
          {createState.success && <p className="text-xs text-accent-green">✓ Match created</p>}
          <button type="submit" disabled={createPending}
            className="w-full rounded-lg bg-gold text-ink text-sm font-semibold py-2.5 min-h-tap disabled:opacity-50">
            {createPending ? "Creating…" : "Add match"}
          </button>
        </form>
      </div>

      {/* Bracket wiring for existing matches */}
      <BracketWiringSection matches={matches} teamNames={teamNames} />

      {/* Existing knockout matches by stage */}
      {byStage.filter(s => s.matches.length > 0).map(stage => (
        <div key={stage.value} className="space-y-3">
          <h3 className="text-xs text-ink-2 uppercase tracking-wide font-medium">
            {stage.label}
          </h3>
          {stage.matches.map(match => (
            <div key={match.id} className="rounded-xl bg-paper-2 border border-line p-4">
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
        <p className="text-sm text-ink-3 text-center py-6">
          No knockout matches yet — add them above as teams qualify.
        </p>
      )}
    </div>
  );
}
