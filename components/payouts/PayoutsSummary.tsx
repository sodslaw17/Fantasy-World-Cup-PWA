import { Card, Pill } from "@/components/wc-ui";
import type { OverallEntry } from "@/lib/scoring/overall";
import type { EfficiencyEntry, DisciplineEntry } from "@/lib/scoring/sidepots";

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
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold tracking-[.05em] uppercase text-ink-3">{title}</p>
          <p className="font-num font-bold text-2xl text-gold-ink mt-0.5">{amount}</p>
        </div>
        {isFinal && winner && (
          <Pill color="gold">🏆 Winner</Pill>
        )}
      </div>

      {winner ? (
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-bold text-ink">{winner}</p>
          {metric && (
            <p className="text-xs text-ink-2">
              {metricLabel}: <span className="text-ink font-semibold">{metric}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-3 italic">
          {isFinal ? "No data yet" : "Tournament in progress"}
        </p>
      )}

      {rank2 && (
        <p className="text-xs text-ink-3 border-t border-line pt-2">2nd: {rank2}</p>
      )}
    </Card>
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
    <>
      {!tournamentComplete && (
        <Card tone="gold" className="px-4 py-3 text-sm text-gold-ink">
          ⚠ Tournament in progress — winners shown are current leaders, not final.
        </Card>
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
          ? `${effWinner.playerName} · (${effWinner.goals}G + ${effWinner.assists}A) / ${effWinner.minutes}min = ${(effWinner.efficiency * 90).toFixed(2)} per 90`
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

      <Card tone="muted" className="px-4 py-3">
        <p className="text-xs text-ink-3 text-center">
          Total pool: $300 ($30 × 10 players)
        </p>
      </Card>
    </>
  );
}
