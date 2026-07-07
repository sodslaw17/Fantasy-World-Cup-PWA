"use client";

import { useState, type ReactNode } from "react";

type Tab = "efficiency" | "cards" | "penalties";

export function SidePotsTabs({
  efficiencyTab,
  cardsTab,
  penaltiesTab,
}: {
  efficiencyTab: ReactNode;
  cardsTab: ReactNode;
  penaltiesTab: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("efficiency");
  const tabs: { id: Tab; label: string }[] = [
    { id: "efficiency", label: "Efficiency" },
    { id: "cards",      label: "Cards"      },
    { id: "penalties",  label: "Penalties"  },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-paper-2 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? "bg-gold text-ink" : "text-ink-2 hover:text-ink"
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "efficiency" && efficiencyTab}
      {tab === "cards"      && cardsTab}
      {tab === "penalties"  && penaltiesTab}
    </div>
  );
}
