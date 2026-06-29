"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { generateAllNicknames, saveNickname, deleteNickname } from "./actions";

type TeamNickRow = {
  code: string;
  name: string;
  nickname: { nickname: string; status: string } | null;
};

type ProfileRow = {
  profileId: string;
  displayName: string;
  userNickname: { nickname: string; status: string } | null;
  teams: TeamNickRow[];
};

export function NicknamesClient({ rows }: { rows: ProfileRow[] }) {
  const router = useRouter();
  const [generating, setGenerating] = React.useState(false);
  const [genResult, setGenResult] = React.useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenResult(null);
    const res = await generateAllNicknames();
    setGenerating(false);
    if (res.error) setGenResult(`Error: ${res.error}`);
    else setGenResult(`Generated ${res.generated} nicknames.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Generate button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-brand text-brand-on disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate All Nicknames (LLM)"}
        </button>
        {genResult && <span className="text-sm text-ink-2">{genResult}</span>}
      </div>

      {/* Per-user tables */}
      {rows.map((row) => (
        <UserNickRow key={row.profileId} row={row} onSaved={() => router.refresh()} />
      ))}
    </div>
  );
}

function UserNickRow({ row, onSaved }: { row: ProfileRow; onSaved: () => void }) {
  const allNicks = [
    { code: "", label: `${row.displayName} (person)`, current: row.userNickname },
    ...row.teams.map((t) => ({ code: t.code, label: t.name, current: t.nickname })),
  ];

  return (
    <div className="border border-line rounded-xl overflow-hidden">
      <div className="bg-paper-2 px-4 py-2.5 border-b border-line">
        <span className="font-bold text-sm">{row.displayName}</span>
      </div>
      <div className="divide-y divide-line/60">
        {allNicks.map((n) => (
          <NicknameRow
            key={n.code}
            profileId={row.profileId}
            teamCode={n.code}
            label={n.label}
            current={n.current}
            onSaved={onSaved}
          />
        ))}
      </div>
    </div>
  );
}

function NicknameRow({
  profileId,
  teamCode,
  label,
  current,
  onSaved,
}: {
  profileId: string;
  teamCode: string;
  label: string;
  current: { nickname: string; status: string } | null;
  onSaved: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(current?.nickname ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave() {
    if (!draft.trim()) return;
    setSaving(true);
    setError(null);
    const res = await saveNickname(profileId, teamCode, draft);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setEditing(false);
    onSaved();
  }

  async function handleDelete() {
    setSaving(true);
    await deleteNickname(profileId, teamCode);
    setSaving(false);
    setEditing(false);
    onSaved();
  }

  return (
    <div className="px-4 py-2.5 flex items-center gap-3">
      <span className="text-xs text-ink-3 w-28 shrink-0">{label}</span>

      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            className="flex-1 text-sm rounded-md border border-line-2 bg-surface px-2 py-1 text-ink"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold px-2 py-1 rounded bg-brand text-brand-on disabled:opacity-50"
          >
            {saving ? "…" : "Save"}
          </button>
          <button onClick={() => setEditing(false)} className="text-xs px-2 py-1 rounded bg-paper-3 text-ink">
            Cancel
          </button>
          {current && (
            <button onClick={handleDelete} className="text-xs px-2 py-1 rounded bg-paper-3 text-bad">
              Delete
            </button>
          )}
          {error && <span className="text-xs text-bad">{error}</span>}
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-2">
          {current ? (
            <>
              <span className="text-sm font-semibold text-ink">{current.nickname}</span>
              <span className="text-[10px] text-ink-3">{current.status}</span>
            </>
          ) : (
            <span className="text-sm text-ink-3 italic">— not set —</span>
          )}
          <button
            onClick={() => { setDraft(current?.nickname ?? ""); setEditing(true); }}
            className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded bg-paper-3 text-ink"
          >
            {current ? "Edit" : "Set"}
          </button>
        </div>
      )}
    </div>
  );
}
