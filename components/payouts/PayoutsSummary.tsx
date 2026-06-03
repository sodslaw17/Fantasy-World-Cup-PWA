import type { OverallEntry } from "@/lib/scoring/overall";
import type { EfficiencyEntry } from "@/lib/scoring/sidepots";
import type { DisciplineEntry } from "@/lib/scoring/sidepots";

interface PotCardProps {
  title: string;
  amount: string;
  winner: string | null;
  metric: string | null;
  metricLabel: string;
  rank2?: string | null;
  isFinal: boolean;
}

function PotCard({ title, amount, winner, metric, metricLabel, rank2, isFinal }: PotCardProps) {
  return (
    <div className="rounded-xl bg-ink-soft border border-paper/10 p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-paper/50 uppercase tracking-wide font-medium">{title}</p>
          <p className="text-2xl font-black text-gold mt-0.5">{amount}</p>
        </div>
        {isFinal && winner && (
          <span className="text-2xl">🏆</span>
        )}
      </div>

      {winner ? (
        <div className="space-y-1">
          <p className="text-base font-bold">{winner}</p>
          {metric && (
            <p className="text-xs text-paper/50">
              {metricLabel}: <span className="text-paper/80 font-medium">{metric}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-paper/40 italic">
          {isFinal ? "No data yet" : "Tournament in progress"}
        </p>
      )}

      {rank2 && (
        <p className="text-xs text-paper/30 border-t border-paper/10 pt-2">2nd: {rank2}</p>
      )}
    </div>
  );
}

export function PayoutsSummary({
  overall,
  efficiency,
  discipline,
  tournamentComplete,
}: {
  overall: OverallEntry[];
  efficiency: EfficiencyEntry[];
  discipline: DisciplineEntry[];
  tournamentComplete: boolean;
}) {
  const overallWinner = overall[0] ?? null;
  const effWinner = efficiency[0] ?? null;
  const discWinner = discipline[0] ?? null;

  return (
    <div className="space-y-4">
      {!tournamentComplete && (
        <div className="rounded-xl bg-gold/10 border border-gold/30 px-4 py-3 text-sm text-gold/80">
          ⚠ Tournament in progress — winners shown are current leaders, not final.
        </div>
      )}

      <PotCard
        title="Overall winner"
        amount="$240"
        winner={overallWinner?.displayName ?? null}
        metric={overallWinner ? `${overallWinner.totalPoints} pts (GD ${overallWinner.goalDifference >= 0 ? "+" : ""}${overallWinner.goalDifference})` : null}
        metricLabel="Points"
        rank2={overall[1]?.displayName ?? null}
        isFinal={tournamentComplete}
      />

      <PotCard
        title="1st Side Pot — Most efficient footballer"
        amount="$30"
        winner={effWinner?.displayName ?? null}
        metric={effWinner
          ? `${effWinner.playerName} · (${effWinner.goals}G + ${effWinner.assists}A) / ${effWinner.minutes}min = ${effWinner.efficiency.toFixed(4)}`
          : null}
        metricLabel="Efficiency"
        rank2={efficiency[1]?.displayName ?? null}
        isFinal={tournamentComplete}
      />

      <PotCard
        title="2nd Side Pot — Worst discipline"
        amount="$30"
        winner={discWinner?.displayName ?? null}
        metric={discWinner
          ? `${discWinner.totalCardPoints} card pts (teams: ${discWinner.teamCodes.join(", ")})`
          : null}
        metricLabel="Card points"
        rank2={discipline[1]?.displayName ?? null}
        isFinal={tournamentComplete}
      />

      <div className="rounded-xl bg-ink-soft border border-paper/10 px-4 py-3">
        <p className="text-xs text-paper/40 text-center">
          Total pool: $300 ($30 × 10 players)
        </p>
      </div>
    </div>
  );
}
