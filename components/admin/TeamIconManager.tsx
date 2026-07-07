"use client";

import { useState } from "react";
import { updateTeamIcon } from "@/app/admin/teams/actions";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface TeamRow {
  id: string;
  fifaCode: string;
  name: string;
  iconUrl: string | null;
}

export function TeamIconManager({
  groups,
}: {
  groups: Record<string, TeamRow[]>;
}) {
  return (
    <div className="space-y-4">
      {Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([letter, teams]) => (
          <div key={letter} className="rounded-xl bg-paper-2 border border-line overflow-hidden">
            <div className="px-4 py-2 border-b border-line bg-paper/5">
              <span className="text-xs font-semibold text-ink-2">Group {letter}</span>
            </div>
            <div className="divide-y divide-paper/5">
              {teams.map((team) => (
                <TeamIconRow key={team.id} team={team} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function TeamIconRow({ team }: { team: TeamRow }) {
  const [msg, setMsg] = useState("");

  async function handleComplete(url: string | null) {
    const result = await updateTeamIcon(team.id, url ?? "");
    if (result.error) setMsg(result.error);
    else setMsg("Saved");
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink mb-1.5">
          <span className="font-mono text-ink-3 mr-1.5">{team.fifaCode}</span>
          {team.name}
        </p>
        <ImageUpload
          bucket="team-icons"
          storagePath={team.id}
          currentUrl={team.iconUrl}
          shape="square"
          size="sm"
          onComplete={handleComplete}
        />
      </div>
      {msg && (
        <span className={`text-xs shrink-0 ${msg === "Saved" ? "text-accent-green" : "text-accent-red"}`}>
          {msg === "Saved" ? "✓ Saved" : msg}
        </span>
      )}
    </div>
  );
}
