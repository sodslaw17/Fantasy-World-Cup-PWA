"use client";

import { useState, type ReactNode } from "react";

export function ResultsTabs({
  groupTab,
  knockoutTab,
}: {
  groupTab: ReactNode;
  knockoutTab: ReactNode;
}) {
  const [tab, setTab] = useState<"group" | "knockout">("group");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-paper-2 rounded-lg p-1 w-fit">
        {(["group", "knockout"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-gold text-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            {t === "group" ? "Group stage" : "Knockout"}
          </button>
        ))}
      </div>
      {tab === "group" ? groupTab : knockoutTab}
    </div>
  );
}
