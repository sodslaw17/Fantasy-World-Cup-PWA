"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/wc-ui";
import { Avatar } from "@/components/ui/Avatar";
import { scoreKnockoutMatch, type KnockoutMatch, type KnockoutStage } from "@/lib/scoring/knockout";
import {
  generatePreGame,
  generatePostGame,
  generateAllPendingRecaps,
  saveCommentaryEdit,
  clearCommentary,
  setSassLevel,
} from "@/app/today/actions";
import type { Match, SassLevel } from "@/lib/db";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface UserPrediction {
  displayName: string;
  authId: string;
  avatarUrl: string | null;
  homeGoalsPred: number | null;
  awayGoalsPred: number | null;
}

export interface DrafterInfo {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface EffPickForDisplay {
  profileId: string;
  displayName: string;
  playerName: string;
  teamCode: string | null;
  playerPhotoUrl: string | null;
}

export interface CommentaryData {
  matchId: string;
  pregameText: string | null;
  pregameStatus: "none" | "generated" | "edited";
  pregameGeneratedAt: string | null;
  postgameText: string | null;
  postgameStatus: "none" | "generated" | "edited";
  postgameGeneratedAt: string | null;
}

export interface TodayMatch extends Match {
  homeTeamName: string;
  awayTeamName: string;
  myPrediction: { home: number; away: number } | null;
  otherPredictions: UserPrediction[];
}

// ─── Stage label ───────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  group: "",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-Finals",
  sf: "Semi-Finals",
  final: "Finals",
  bronze: "3rd Place Game",
};

function stageLabel(match: TodayMatch): string {
  if (match.stage === "group") return `Group ${match.group_letter ?? ""}`;
  return STAGE_LABEL[match.stage] ?? match.stage;
}

// ─── TodayView ─────────────────────────────────────────────────────────────────

export function TodayView({
  matches,
  draftsByTeam = {},
  isAdmin = false,
  effPicks = [],
  commentary = {},
  myProfileId = null,
  sassLevel = "medium",
}: {
  matches: TodayMatch[];
  draftsByTeam?: Record<string, DrafterInfo>;
  isAdmin?: boolean;
  effPicks?: EffPickForDisplay[];
  commentary?: Record<string, CommentaryData>;
  myProfileId?: string | null;
  sassLevel?: SassLevel;
}) {
  const router = useRouter();
  const [bulkGenerating, setBulkGenerating] = React.useState(false);
  const [bulkResult, setBulkResult] = React.useState<string | null>(null);
  const [currentSass, setCurrentSass] = React.useState<SassLevel>(sassLevel);
  const [sassUpdating, setSassUpdating] = React.useState(false);

  if (matches.length === 0) {
    return (
      <Card className="py-14 px-4 flex flex-col items-center text-center gap-3">
        <span className="text-[40px]">📅</span>
        <p className="text-ink-2 text-sm">No matches today.</p>
        <p className="text-ink-3 text-xs">Check back on match days for the latest games.</p>
      </Card>
    );
  }

  // Finished knockout matches that need a post-game recap
  const pendingRecapIds = matches
    .filter(
      (m) =>
        m.stage !== "group" &&
        m.status === "finished" &&
        (!commentary[m.id] || commentary[m.id].postgameStatus === "none"),
    )
    .map((m) => m.id);

  async function handleGenerateAll() {
    setBulkGenerating(true);
    setBulkResult(null);
    const res = await generateAllPendingRecaps(pendingRecapIds);
    setBulkGenerating(false);
    if (res.error) {
      setBulkResult(`${res.generated ?? 0} generated. Error: ${res.error}`);
    } else {
      setBulkResult(`${res.generated ?? 0} recap${res.generated === 1 ? "" : "s"} generated.`);
    }
    router.refresh();
  }

  async function handleSassChange(level: SassLevel) {
    setSassUpdating(true);
    setCurrentSass(level);
    await setSassLevel(level);
    setSassUpdating(false);
    router.refresh();
  }

  return (
    <>
      {/* Admin controls: sass dial + bulk generate */}
      {isAdmin && (
        <div className="flex flex-col gap-1.5 px-1">
          {/* Sass dial */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-ink-3 font-bold shrink-0">Sass</span>
            <div className="flex gap-1">
              {(["mild", "medium", "spicy", "unhinged"] as SassLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => handleSassChange(level)}
                  disabled={sassUpdating}
                  className={[
                    "text-[10px] font-semibold px-2 py-0.5 rounded capitalize",
                    currentSass === level
                      ? "bg-brand text-brand-on"
                      : "bg-paper-3 text-ink-2",
                  ].join(" ")}
                >
                  {level}
                </button>
              ))}
            </div>
            {sassUpdating && <span className="text-[10px] text-ink-3">saving…</span>}
          </div>

          {pendingRecapIds.length > 0 && (
            <button
              onClick={handleGenerateAll}
              disabled={bulkGenerating}
              className="text-[12px] font-semibold py-2 px-3 rounded-lg bg-brand text-brand-on disabled:opacity-50 text-left"
            >
              {bulkGenerating
                ? "Generating recaps…"
                : `Generate all pending recaps (${pendingRecapIds.length})`}
            </button>
          )}

          {bulkResult && <p className="text-[11px] text-ink-2">{bulkResult}</p>}
        </div>
      )}

      {matches.map((match) => (
        <MatchBlock
          key={match.id}
          match={match}
          draftsByTeam={draftsByTeam}
          isAdmin={isAdmin}
          effPicksForMatch={effPicks.filter(
            (ep) =>
              ep.teamCode === match.home_team_code ||
              ep.teamCode === match.away_team_code,
          )}
          commentaryData={commentary[match.id] ?? null}
        />
      ))}
    </>
  );
}

// ─── MatchBlock ────────────────────────────────────────────────────────────────

function MatchBlock({
  match,
  draftsByTeam,
  isAdmin,
  effPicksForMatch,
  commentaryData,
}: {
  match: TodayMatch;
  draftsByTeam: Record<string, DrafterInfo>;
  isAdmin: boolean;
  effPicksForMatch: EffPickForDisplay[];
  commentaryData: CommentaryData | null;
}) {
  const kickoff = new Date(match.kickoff_utc);
  const timeStr = kickoff.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const finished = match.status === "finished";
  const live = match.status === "live";
  const isKnockout = match.stage !== "group";

  const homeDrafter = isKnockout && match.home_team_code
    ? (draftsByTeam[match.home_team_code] ?? null)
    : null;
  const awayDrafter = isKnockout && match.away_team_code
    ? (draftsByTeam[match.away_team_code] ?? null)
    : null;

  return (
    <Card className="overflow-hidden p-0 shrink-0">
      {/* ── Header + score ── */}
      <div className="px-4 py-3 bg-paper-2 border-b border-line">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold">
            {live ? (
              <span className="text-red-ink font-bold">● LIVE</span>
            ) : finished ? (
              <span className="text-ink-3">Full time</span>
            ) : (
              <span className="text-ink-2">{timeStr}</span>
            )}
          </span>
          <span className="text-[11px] font-semibold text-ink-3">{stageLabel(match)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-right text-sm font-semibold truncate text-ink">
            {match.homeTeamName}
          </span>
          <div className="shrink-0 text-center min-w-[72px]">
            {finished || live ? (
              <span className="font-num font-black text-xl tabular-nums text-ink">
                {match.home_goals ?? "–"} – {match.away_goals ?? "–"}
              </span>
            ) : (
              <span className="text-sm text-ink-3 font-medium">vs</span>
            )}
          </div>
          <span className="flex-1 text-left text-sm font-semibold truncate text-ink">
            {match.awayTeamName}
          </span>
        </div>
      </div>

      {/* ── #3 Pool stakes ── */}
      {isKnockout && (
        <PoolStakes
          homeDrafter={homeDrafter}
          awayDrafter={awayDrafter}
          homeTeamName={match.homeTeamName}
          awayTeamName={match.awayTeamName}
        />
      )}

      {/* ── #4 Efficiency-pick alert ── */}
      {isKnockout && effPicksForMatch.length > 0 && (
        <EfficiencyAlert picks={effPicksForMatch} />
      )}

      {/* ── #5 Commentary section ── */}
      {isKnockout && (homeDrafter || awayDrafter || effPicksForMatch.length > 0) && (
        <CommentarySection
          match={match}
          homeDrafter={homeDrafter}
          awayDrafter={awayDrafter}
          commentaryData={commentaryData}
          isAdmin={isAdmin}
        />
      )}
    </Card>
  );
}

// ─── #3 Pool stakes ────────────────────────────────────────────────────────────

function PoolStakes({
  homeDrafter,
  awayDrafter,
  homeTeamName,
  awayTeamName,
}: {
  homeDrafter: DrafterInfo | null;
  awayDrafter: DrafterInfo | null;
  homeTeamName: string;
  awayTeamName: string;
}) {
  if (!homeDrafter && !awayDrafter) return null;

  const isDuel =
    !!homeDrafter &&
    !!awayDrafter &&
    homeDrafter.profileId !== awayDrafter.profileId;

  if (isDuel) {
    return (
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
            <span className="text-[12px] text-ink font-semibold truncate">
              {homeDrafter.displayName}
            </span>
            <Avatar name={homeDrafter.displayName} url={homeDrafter.avatarUrl} size="xs" />
          </div>
          <div className="shrink-0 min-w-[72px] flex justify-center">
            <span className="text-[11px] font-bold text-brand-ink tracking-wide uppercase">vs</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <Avatar name={awayDrafter.displayName} url={awayDrafter.avatarUrl} size="xs" />
            <span className="text-[12px] text-ink font-semibold truncate">
              {awayDrafter.displayName}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // One-sided or same user
  if (homeDrafter && awayDrafter && homeDrafter.profileId === awayDrafter.profileId) {
    return (
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Avatar name={homeDrafter.displayName} url={homeDrafter.avatarUrl} size="xs" />
          <span className="text-[12px] text-ink-2">
            <span className="font-semibold text-ink">{homeDrafter.displayName}</span> has both teams
          </span>
        </div>
      </div>
    );
  }

  const items: Array<{ drafter: DrafterInfo; teamName: string }> = [];
  if (homeDrafter) items.push({ drafter: homeDrafter, teamName: homeTeamName });
  if (awayDrafter) items.push({ drafter: awayDrafter, teamName: awayTeamName });

  return (
    <div className="px-4 py-2.5">
      <div className="flex flex-col gap-1.5">
        {items.map(({ drafter, teamName }) => (
          <div key={drafter.profileId + teamName} className="flex items-center gap-1.5">
            <Avatar name={drafter.displayName} url={drafter.avatarUrl} size="xs" />
            <span className="text-[12px] text-ink-2">
              <span className="font-semibold text-ink">{drafter.displayName}</span>
              {" "}&mdash;{" "}{teamName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── #4 Efficiency-pick alert ──────────────────────────────────────────────────

function EfficiencyAlert({ picks }: { picks: EffPickForDisplay[] }) {
  return (
    <div className="px-4 pb-2 flex flex-wrap gap-x-3 gap-y-1">
      {picks.map((pick) => (
        <div key={pick.profileId} className="flex items-center gap-1">
          {pick.playerPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pick.playerPhotoUrl}
              alt={pick.playerName}
              className="w-4 h-4 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="w-4 h-4 rounded-full bg-brand-soft shrink-0 flex items-center justify-center text-[8px] font-bold text-brand-ink">
              {pick.playerName[0]}
            </span>
          )}
          <span className="text-[11px] text-ink-2">
            <span className="font-semibold text-ink">{pick.displayName}&rsquo;s pick</span>
            {" "}{pick.playerName} plays
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── #5 Commentary section ─────────────────────────────────────────────────────

function CommentarySection({
  match,
  homeDrafter,
  awayDrafter,
  commentaryData,
  isAdmin,
}: {
  match: TodayMatch;
  homeDrafter: DrafterInfo | null;
  awayDrafter: DrafterInfo | null;
  commentaryData: CommentaryData | null;
  isAdmin: boolean;
}) {
  return (
    <div className="border-t border-line/60">
      {/* 5a: Deterministic stakes — always shown when there's involvement */}
      <DeterministicStakes
        match={match}
        homeDrafter={homeDrafter}
        awayDrafter={awayDrafter}
      />

      {/* 5b: AI prose — shown when generated */}
      {commentaryData?.pregameText && match.status !== "finished" && (
        <div className="px-4 pb-3">
          <p className="text-[12px] text-ink-2 leading-relaxed italic">
            {commentaryData.pregameText}
          </p>
        </div>
      )}
      {commentaryData?.postgameText && match.status === "finished" && (
        <div className="px-4 pb-3">
          <p className="text-[12px] text-ink-2 leading-relaxed italic">
            {commentaryData.postgameText}
          </p>
        </div>
      )}

      {/* 5c: Admin controls */}
      {isAdmin && (
        <AdminCommentaryPanel match={match} commentaryData={commentaryData} />
      )}
    </div>
  );
}

// ─── 5a: Deterministic stakes ──────────────────────────────────────────────────

function DeterministicStakes({
  match,
  homeDrafter,
  awayDrafter,
}: {
  match: TodayMatch;
  homeDrafter: DrafterInfo | null;
  awayDrafter: DrafterInfo | null;
}) {
  if (!homeDrafter && !awayDrafter) return null;

  const finished = match.status === "finished";
  const isBronze = match.stage === "bronze";
  const winBonus = isBronze ? 1 : 2;
  const penLossBonus = isBronze ? 0 : 1;

  function actualPoints(teamCode: string): number | null {
    if (
      !finished ||
      match.home_goals === null ||
      match.away_goals === null
    )
      return null;
    const km: KnockoutMatch = {
      id: match.id,
      stage: match.stage as KnockoutStage,
      home_team_code: match.home_team_code,
      away_team_code: match.away_team_code,
      home_goals: match.home_goals,
      away_goals: match.away_goals,
      went_to_shootout: match.went_to_shootout,
      shootout_winner: match.shootout_winner,
      status: match.status,
    };
    return scoreKnockoutMatch(km, teamCode);
  }

  const rows: Array<{ drafter: DrafterInfo; teamName: string; teamCode: string }> = [];
  if (homeDrafter && match.home_team_code) {
    rows.push({ drafter: homeDrafter, teamName: match.homeTeamName, teamCode: match.home_team_code });
  }
  if (awayDrafter && match.away_team_code && awayDrafter.profileId !== homeDrafter?.profileId) {
    rows.push({ drafter: awayDrafter, teamName: match.awayTeamName, teamCode: match.away_team_code });
  } else if (awayDrafter && match.away_team_code && !homeDrafter) {
    rows.push({ drafter: awayDrafter, teamName: match.awayTeamName, teamCode: match.away_team_code });
  }

  return (
    <div className="px-4 pt-2.5 pb-2">
      <div className="flex flex-col gap-1">
        {rows.map(({ drafter, teamName, teamCode }) => {
          const pts = actualPoints(teamCode);
          return (
            <div key={drafter.profileId + teamCode} className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-ink-2 truncate">
                <span className="font-semibold text-ink">{drafter.displayName}</span>
                {" "}&mdash;{" "}{teamName}
              </span>
              <span className="text-[11px] font-semibold text-brand-ink shrink-0 tabular-nums">
                {pts !== null
                  ? `+${pts} pts`
                  : `win +${winBonus}${penLossBonus > 0 ? ` / pen-loss +${penLossBonus}` : ""} + goals`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 5c: Admin commentary panel ────────────────────────────────────────────────

function AdminCommentaryPanel({
  match,
  commentaryData,
}: {
  match: TodayMatch;
  commentaryData: CommentaryData | null;
}) {
  const router = useRouter();
  const [generating, setGenerating] = React.useState<"pregame" | "postgame" | null>(null);
  const [editMode, setEditMode] = React.useState<"pregame" | "postgame" | null>(null);
  const [editText, setEditText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const finished = match.status === "finished";

  function fmtTime(ts: string | null) {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function statusBadge(status: string) {
    if (status === "edited") return "edited";
    if (status === "generated") return "generated";
    return "none";
  }

  async function handleGenerate(type: "pregame" | "postgame") {
    setGenerating(type);
    setError(null);
    const res = type === "pregame"
      ? await generatePreGame(match.id)
      : await generatePostGame(match.id);
    setGenerating(null);
    if (res.error) setError(res.error);
    else router.refresh();
  }

  async function handleSaveEdit() {
    if (!editMode) return;
    setSaving(true);
    setError(null);
    const res = await saveCommentaryEdit(match.id, editMode, editText);
    setSaving(false);
    if (res.error) setError(res.error);
    else { setEditMode(null); router.refresh(); }
  }

  async function handleClear(type: "pregame" | "postgame") {
    setError(null);
    const res = await clearCommentary(match.id, type);
    if (res.error) setError(res.error);
    else router.refresh();
  }

  function startEdit(type: "pregame" | "postgame") {
    const text = type === "pregame"
      ? (commentaryData?.pregameText ?? "")
      : (commentaryData?.postgameText ?? "");
    setEditMode(type);
    setEditText(text);
  }

  const pgStatus = commentaryData?.pregameStatus ?? "none";
  const poStatus = commentaryData?.postgameStatus ?? "none";

  return (
    <div className="border-t border-line/60 bg-paper-2/60 px-4 py-2.5 flex flex-col gap-2">
      {/* Admin label */}
      <span className="text-[10px] uppercase tracking-widest text-ink-3 font-bold">Admin</span>

      {/* Edit textarea */}
      {editMode && (
        <div className="flex flex-col gap-1.5">
          <textarea
            className="w-full text-[12px] rounded-lg border border-line-2 bg-surface p-2 text-ink resize-none min-h-[80px]"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="text-[11px] font-semibold px-3 py-1 rounded-md bg-brand text-brand-on disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditMode(null)}
              className="text-[11px] font-semibold px-3 py-1 rounded-md bg-paper-3 text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pre-game row */}
      {!editMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-ink-2 shrink-0">
            Pre-game:{" "}
            <span className={pgStatus === "none" ? "text-ink-3" : "text-ink font-semibold"}>
              {statusBadge(pgStatus)}
            </span>
            {commentaryData?.pregameGeneratedAt && (
              <span className="text-ink-3"> · {fmtTime(commentaryData.pregameGeneratedAt)}</span>
            )}
          </span>
          <div className="flex gap-1.5 ml-auto">
            <button
              onClick={() => handleGenerate("pregame")}
              disabled={generating === "pregame"}
              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-soft text-brand-ink disabled:opacity-50"
            >
              {generating === "pregame" ? "…" : pgStatus === "none" ? "Generate" : "Regen"}
            </button>
            {pgStatus !== "none" && (
              <>
                <button
                  onClick={() => startEdit("pregame")}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-paper-3 text-ink"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleClear("pregame")}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-paper-3 text-ink-3"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Post-game row */}
      {!editMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-ink-2 shrink-0">
            Post-game:{" "}
            <span className={poStatus === "none" ? "text-ink-3" : "text-ink font-semibold"}>
              {statusBadge(poStatus)}
            </span>
            {commentaryData?.postgameGeneratedAt && (
              <span className="text-ink-3"> · {fmtTime(commentaryData.postgameGeneratedAt)}</span>
            )}
          </span>
          <div className="flex gap-1.5 ml-auto">
            {finished && (
              <button
                onClick={() => handleGenerate("postgame")}
                disabled={generating === "postgame"}
                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-soft text-brand-ink disabled:opacity-50"
              >
                {generating === "postgame" ? "…" : poStatus === "none" ? "Generate" : "Regen"}
              </button>
            )}
            {!finished && poStatus === "none" && (
              <span className="text-[10px] text-ink-3">Available after final whistle</span>
            )}
            {poStatus !== "none" && (
              <>
                <button
                  onClick={() => startEdit("postgame")}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-paper-3 text-ink"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleClear("postgame")}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-paper-3 text-ink-3"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-bad">{error}</p>
      )}
    </div>
  );
}
