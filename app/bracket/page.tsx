"use client";

import { useState, useEffect } from "react";
import { BracketView, type BracketMatch } from "@/components/bracket/BracketView";

// Client shell — data is fetched from a server action
import { getBracketData } from "./actions";

export default function BracketPage() {
  const [data, setData] = useState<{ matchesByStage: Record<string, BracketMatch[]> } | null>(null);
  const [stage, setStage] = useState("r32");

  useEffect(() => {
    getBracketData().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen pb-28 flex items-center justify-center">
        <p className="text-paper/40 text-sm">Loading bracket…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold text-gold">Bracket</h1>
        <p className="text-xs text-paper/50">Knockout stage · tap a round to view</p>
      </header>
      <div className="px-4">
        <BracketView
          matchesByStage={data.matchesByStage}
          selectedStage={stage}
          onStageSelect={setStage}
        />
      </div>
    </div>
  );
}
