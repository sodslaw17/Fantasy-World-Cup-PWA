"use client";

import { useState } from "react";
import { importTeams, importFixtures } from "@/app/admin/import/actions";

type Tab = "teams" | "fixtures";

interface ImportState {
  loading: boolean;
  result?: { success?: boolean; count?: number; error?: string };
}

const TEAMS_EXAMPLE = `fifa_code,name,group_letter,flag_url
USA,United States,A,
FRA,France,A,
BRA,Brazil,B,
GER,Germany,B,`;

const FIXTURES_EXAMPLE = `group_letter,home_team_code,away_team_code,kickoff_utc
A,USA,FRA,2026-06-11T16:00:00Z
B,BRA,GER,2026-06-11T20:00:00Z`;

export function ImportPanel() {
  const [tab, setTab] = useState<Tab>("teams");
  const [csv, setCsv] = useState("");
  const [state, setState] = useState<ImportState>({ loading: false });

  async function handleImport() {
    if (!csv.trim()) return;
    setState({ loading: true });
    const result = tab === "teams" ? await importTeams(csv) : await importFixtures(csv);
    setState({ loading: false, result });
  }

  function loadExample() {
    setCsv(tab === "teams" ? TEAMS_EXAMPLE : FIXTURES_EXAMPLE);
    setState({ loading: false });
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-ink-soft rounded-lg p-1 w-fit">
        {(["teams", "fixtures"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setCsv(""); setState({ loading: false }); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-gold text-ink"
                : "text-paper/60 hover:text-paper"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Format reminder */}
      <div className="text-xs text-paper/50 space-y-1">
        {tab === "teams" ? (
          <p>Required columns: <code className="text-paper/70">fifa_code, name, group_letter</code> — optional: <code className="text-paper/70">flag_url</code></p>
        ) : (
          <p>Required columns: <code className="text-paper/70">group_letter, home_team_code, away_team_code, kickoff_utc</code> (ISO-8601 UTC) — import teams first.</p>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={csv}
        onChange={(e) => { setCsv(e.target.value); setState({ loading: false }); }}
        placeholder={`Paste ${tab} CSV here…`}
        rows={12}
        className="w-full rounded-lg bg-ink border border-paper/20 px-3 py-2.5 text-sm text-paper placeholder:text-paper/30 font-mono focus:outline-none focus:ring-1 focus:ring-gold resize-y"
      />

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleImport}
          disabled={state.loading || !csv.trim()}
          className="rounded-lg bg-gold text-ink text-sm font-semibold px-5 py-2.5 min-h-tap disabled:opacity-50"
        >
          {state.loading ? "Importing…" : `Import ${tab}`}
        </button>
        <button
          onClick={loadExample}
          className="rounded-lg border border-paper/20 text-paper/60 text-sm px-4 py-2.5 min-h-tap hover:text-paper hover:border-paper/40"
        >
          Load example
        </button>
      </div>

      {/* Result */}
      {state.result && (
        <div
          className={`rounded-lg p-3 text-sm ${
            state.result.success
              ? "bg-accent-green/10 border border-accent-green/30 text-accent-green"
              : "bg-accent-red/10 border border-accent-red/30 text-accent-red"
          }`}
        >
          {state.result.success
            ? `✓ ${state.result.count} row(s) imported successfully.`
            : `✗ ${state.result.error}`}
        </div>
      )}
    </div>
  );
}
