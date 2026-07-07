"use client";

import { useActionState, useState, useTransition } from "react";
import { saveMatchResult, createKnockoutMatch, setMatchFeeds, updateKnockoutMatch, deleteKnockoutMatch } from "@/app/admin/results/actions";
import type { Match } from "@/lib/db";
import { slotLabel, slotPrefix, type LabelNode } from "@/lib/bracket-label";

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

function matchWinner(m: Match): string | null {
  if (m.home_goals == null || m.away_goals == null) return null;
  if (m.home_goals > m.away_goals) return m.home_team_code ?? null;
  if (m.away_goals > m.home_goals) return m.away_team_code ?? null;
  if (m.shootout_winner === "home") return m.home_team_code ?? null;
  if (m.shootout_winner === "away") return m.away_team_code ?? null;
  return null;
}

function buildLabelIndex(matches: Match[]): Record<string, LabelNode> {
  return Object.fromEntries(
    matches.map((m) => [
      m.id,
      {
        winner: matchWinner(m),
        loser: (() => {
          const w = matchWinner(m);
          if (!w) return null;
          return w === m.home_team_code ? m.away_team_code : m.home_team_code;
        })(),
        homeCode: m.home_team_code,
        awayCode: m.away_team_code,
        homeFeedId: m.home_feed_match_id,
        awayFeedId: m.away_feed_match_id,
        homeFeedOutcome: (m.home_feed_outcome ?? 'winner') as 'winner' | 'loser',
        awayFeedOutcome: (m.away_feed_outcome ?? 'winner') as 'winner' | 'loser',
      },
    ])
  );
}

// Returns "R32 · USA vs MEX" for known teams, "R16 · USA/MEX vs GER/PAR" for undecided,
// "3rd · Loser of SF1/SF2" for loser-fed slots. Never emits a raw UUID.
function matchOptionLabel(m: Match, labelIdx: Record<string, LabelNode>): string {
  const stage = STAGE_SHORT[m.stage] ?? m.stage;
  const hOut = (m.home_feed_outcome ?? 'winner') as 'winner' | 'loser';
  const aOut = (m.away_feed_outcome ?? 'winner') as 'winner' | 'loser';
  const h = slotLabel(m.home_team_code, m.home_feed_match_id, labelIdx, 0, hOut);
  const a = slotLabel(m.away_team_code, m.away_feed_match_id, labelIdx, 0, aOut);
  const hLabel = h !== "?" ? (m.home_team_code ? h : `${slotPrefix(hOut)} ${h}`) : "?";
  const aLabel = a !== "?" ? (m.away_team_code ? a : `${slotPrefix(aOut)} ${a}`) : "?";
  return `${stage} · ${hLabel} vs ${aLabel}`;
}

// ── Bracket wiring section ─────────────────────────────────────────────────

type WiringDraft = { home: string; away: string; homeOutcome: 'winner' | 'loser'; awayOutcome: 'winner' | 'loser' };

function BracketWiringSection({ matches, labelIdx }: { matches: Match[]; labelIdx: Record<string, LabelNode> }) {
  const [pending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, WiringDraft>>({});
  const [open, setOpen] = useState(false);

  const wirableStages = ["r16", "qf", "sf", "final", "bronze"];
  const wirableMatches = matches.filter((m) => wirableStages.includes(m.stage));

  if (wirableMatches.length === 0) return null;

  function getDraft(matchId: string, m: Match): WiringDraft {
    return drafts[matchId] ?? {
      home: m.home_feed_match_id ?? "",
      away: m.away_feed_match_id ?? "",
      homeOutcome: (m.home_feed_outcome ?? 'winner') as 'winner' | 'loser',
      awayOutcome: (m.away_feed_outcome ?? 'winner') as 'winner' | 'loser',
    };
  }

  function handleSave(m: Match) {
    const { home, away, homeOutcome, awayOutcome } = getDraft(m.id, m);
    startTransition(async () => {
      const result = await setMatchFeeds(m.id, home || null, away || null, homeOutcome, awayOutcome);
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
        <div className="border-t border-line divide-y divide-line overflow-y-auto max-h-[70vh]">
          <p className="px-4 py-2.5 text-xs text-ink-2">
            For each R16–Final match, select which earlier match feeds each slot and whether it advances the winner or loser.
            Set Bronze Final slots to &quot;loser&quot; of each semifinal.
            Once wired, tapping a team in the bracket traces its full path.
          </p>
          {wirableStages.flatMap((stageId) => {
            const feedStage = FEED_STAGE[stageId];
            const feedCandidates = matches.filter((m) => m.stage === feedStage);
            const stageMatches = wirableMatches.filter((m) => m.stage === stageId);
            if (stageMatches.length === 0) return [];
            return stageMatches.map((m) => {
              const draft = getDraft(m.id, m);
              const msg = messages[m.id];
              const outcomeSelect = (side: 'home' | 'away') => (
                <select
                  value={side === 'home' ? draft.homeOutcome : draft.awayOutcome}
                  onChange={(e) => {
                    const val = e.target.value as 'winner' | 'loser';
                    setDrafts((d) => ({
                      ...d,
                      [m.id]: { ...getDraft(m.id, m), [side === 'home' ? 'homeOutcome' : 'awayOutcome']: val },
                    }));
                  }}
                  className="rounded-lg bg-paper-2 border border-line-2 px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="winner">Winner</option>
                  <option value="loser">Loser</option>
                </select>
              );
              return (
                <div key={m.id} className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-ink">{matchOptionLabel(m, labelIdx)}</p>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-ink-3 uppercase tracking-wide">Home slot feeds from</label>
                      <div className="flex gap-1">
                        {outcomeSelect('home')}
                        <select
                          value={draft.home}
                          onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: { ...getDraft(m.id, m), home: e.target.value } }))}
                          className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                        >
                          <option value="">— none —</option>
                          {feedCandidates.map((fc) => (
                            <option key={fc.id} value={fc.id}>{matchOptionLabel(fc, labelIdx)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-ink-3 uppercase tracking-wide">Away slot feeds from</label>
                      <div className="flex gap-1">
                        {outcomeSelect('away')}
                        <select
                          value={draft.away}
                          onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: { ...getDraft(m.id, m), away: e.target.value } }))}
                          className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                        >
                          <option value="">— none —</option>
                          {feedCandidates.map((fc) => (
                            <option key={fc.id} value={fc.id}>{matchOptionLabel(fc, labelIdx)}</option>
                          ))}
                        </select>
                      </div>
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

// ── Knockout match card with inline edit / delete ──────────────────────────

function KnockoutMatchCard({ match, teamNames, labelIdx }: { match: Match; teamNames: Record<string, string>; labelIdx: Record<string, LabelNode> }) {
  const side = (code: string | null, feedId: string | null) => {
    if (code) return teamNames[code] ?? code;
    const lbl = slotLabel(null, feedId, labelIdx);
    return lbl !== "?" ? lbl : "TBD";
  };
  const homeTeam = side(match.home_team_code, match.home_feed_match_id);
  const awayTeam = side(match.away_team_code, match.away_feed_match_id);

  const [mode, setMode] = useState<"view" | "edit" | "confirmDelete">("view");
  const [pending, startTransition] = useTransition();
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  function handleEdit(fd: FormData) {
    setEditError(null);
    setEditSuccess(false);
    startTransition(async () => {
      const r = await updateKnockoutMatch(fd);
      if (r.error) { setEditError(r.error); }
      else { setEditSuccess(true); setMode("view"); }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteKnockoutMatch(match.id);
    });
  }

  return (
    <div className="rounded-xl bg-paper-2 border border-line p-4 space-y-3">
      {/* Score entry always visible */}
      <MatchResultForm match={match} homeTeam={homeTeam} awayTeam={awayTeam} />

      {/* Edit / Delete controls */}
      {mode === "view" && (
        <div className="flex gap-2 pt-1 border-t border-line">
          <button
            onClick={() => setMode("edit")}
            className="flex-1 rounded-lg border border-line-2 text-xs font-semibold text-ink-2 py-1.5 hover:bg-paper-2"
          >
            Edit fixture
          </button>
          <button
            onClick={() => setMode("confirmDelete")}
            className="rounded-lg border border-accent-red/40 text-xs font-semibold text-accent-red px-3 py-1.5 hover:bg-accent-red/10"
          >
            Delete
          </button>
        </div>
      )}

      {mode === "edit" && (
        <form
          action={handleEdit}
          className="space-y-2 pt-1 border-t border-line"
        >
          <input type="hidden" name="match_id" value={match.id} />
          <p className="text-xs font-semibold text-ink-2">Edit fixture</p>
          <div className="flex gap-2">
            <input
              name="home_team_code"
              type="text"
              list="team-codes-list"
              defaultValue={match.home_team_code ?? ""}
              placeholder="Home code (blank = TBD)"
              className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-3 py-2 text-sm font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <span className="self-center text-ink-3 text-sm">vs</span>
            <input
              name="away_team_code"
              type="text"
              list="team-codes-list"
              defaultValue={match.away_team_code ?? ""}
              placeholder="Away code (blank = TBD)"
              className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-3 py-2 text-sm font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <input
            name="kickoff_utc"
            type="text"
            defaultValue={match.kickoff_utc}
            placeholder="2026-07-01T19:00:00Z"
            className="w-full rounded-lg bg-paper-2 border border-line-2 px-3 py-2 text-sm font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand"
          />
          {editError && <p className="text-xs text-accent-red">{editError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-brand text-white text-xs font-semibold py-2 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("view"); setEditError(null); }}
              className="rounded-lg border border-line-2 text-xs font-semibold text-ink-2 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "confirmDelete" && (
        <div className="pt-1 border-t border-line space-y-2">
          <p className="text-xs text-accent-red font-semibold">Delete this fixture? This cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={pending}
              className="flex-1 rounded-lg bg-accent-red text-white text-xs font-semibold py-2 disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              onClick={() => setMode("view")}
              className="rounded-lg border border-line-2 text-xs font-semibold text-ink-2 px-3 py-2"
            >
              Cancel
            </button>
          </div>
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

  const labelIdx = buildLabelIndex(matches);

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
          <datalist id="team-codes-list">
            {Object.entries(teamNames).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </datalist>
          <div className="flex gap-2">
            <input name="home_team_code" type="text" list="team-codes-list" placeholder="Home code (blank = TBD)"
              className="flex-1 rounded-lg bg-paper-2 border border-line-2 px-3 py-2.5 text-sm font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand min-h-tap" />
            <span className="self-center text-ink-3 text-sm">vs</span>
            <input name="away_team_code" type="text" list="team-codes-list" placeholder="Away code (blank = TBD)"
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
                      <option key={m.id} value={m.id}>{matchOptionLabel(m, labelIdx)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-ink-3">Away slot winner comes from</label>
                  <select name="away_feed_match_id"
                    className="w-full rounded-lg bg-paper-2 border border-line-2 px-2 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand">
                    <option value="">— none —</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>{matchOptionLabel(m, labelIdx)}</option>
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
      <BracketWiringSection matches={matches} labelIdx={labelIdx} />

      {/* Existing knockout matches by stage */}
      {byStage.filter(s => s.matches.length > 0).map(stage => (
        <div key={stage.value} className="space-y-3">
          <h3 className="text-xs text-ink-2 uppercase tracking-wide font-medium">
            {stage.label}
          </h3>
          {stage.matches.map(match => (
            <KnockoutMatchCard key={match.id} match={match} teamNames={teamNames} labelIdx={labelIdx} />
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
