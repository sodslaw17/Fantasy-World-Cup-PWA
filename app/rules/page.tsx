import { ScreenHeader, Scroll, Card } from "@/components/wc-ui";

export const metadata = { title: "Rules — WC26 Pool" };

export default function RulesPage() {
  return (
    <div className="flex flex-col h-dvh">
      <ScreenHeader
        title="Rulebook"
        sub="WC26 Fantasy Pool · official rules"
      />
      <Scroll>
        <Section title="Buy-in">
          <p className="text-sm text-ink-2">Buy-in is <strong className="text-ink">$30 per player</strong>.</p>
        </Section>

        <Section title="Ways to win money">
          <Pot title="Overall winner — $240" badge="🏆">
            Most combined points (group predictions + knockout). Tiebreaker: combined
            goal difference of your 3 drafted knockout teams.
          </Pot>
          <Pot title="1st Side Pot — $30" badge="⚡">
            Most efficient footballer. Each player pre-drafted one single footballer.
            Winner = highest <em>(goals + assists) / minutes played</em> at tournament end.
            Stats entered manually by admins.
          </Pot>
          <Pot title="2nd Side Pot — $30" badge="🟨">
            Worst discipline. Most card points accumulated by your 3 drafted knockout teams
            across the entire tournament (group + knockout stages).
            <br /><br />
            Card values: 1st yellow = 1 pt · 2nd yellow = 2 pts · straight red = 4 pts.
            A two-yellow red counts as 1 + 2 = 3 pts.
          </Pot>
        </Section>

        <Section title="Group stage predictions">
          <p className="text-sm text-ink-2">Predict the scoreline of every group-stage match (72 total). Must be submitted before the first kick-off on June 11. Predictions lock server-side at that moment — you cannot edit after.</p>
          <Scoring rows={[
            ["Correct outcome (win/draw/loss)", "+2"],
            ["Correct exact score", "+1 (on top of the +2)"],
            ["Wrong outcome", "+0"],
            ["Maximum per match", "+3"],
          ]} />
          <p className="text-xs text-ink-3 mt-1">
            Worked example — actual: Mexico 1 – 2 South Africa
          </p>
          <Scoring rows={[
            ["Predicted MEX 2–1 RSA (wrong outcome)", "0"],
            ["Predicted MEX 1–3 RSA (correct outcome)", "2"],
            ["Predicted MEX 1–2 RSA (exact)", "3"],
          ]} />
          <p className="text-sm text-ink-2 mt-2">Group stage tiebreaker: closest predicted total goals across all 72 matches. If equidistant, lower predicted total wins.</p>
        </Section>

        <Section title="Post-group snake draft">
          <p className="text-sm text-ink-2">Group stage totals determine draft pick order. Highest scorer picks their snake position first. Positions are chosen, then teams are drafted from the Round of 32.</p>
          <p className="text-sm text-ink-2 mt-2">With 10 players: <strong className="text-ink">3 teams per player</strong> (30 of the 32 teams drafted; 2 go undrafted).</p>
          <p className="text-sm text-ink-2 mt-2">The draft runs over SMS. The app records the locked results — it does not run a live draft.</p>
        </Section>

        <Section title="Knockout scoring">
          <p className="text-sm text-ink-2">Points per drafted team, per match:</p>
          <Scoring rows={[
            ["Your team wins the game", "+2"],
            ["Your team loses a penalty shootout", "+1"],
            ["Your team loses in open play / ET", "+0"],
            ["Goals scored by your team", "+ (goals, excl. shootout goals)"],
          ]} />
          <p className="text-sm font-semibold text-ink mt-2">3rd place / Bronze Final</p>
          <Scoring rows={[
            ["Win", "+1 (not +2)"],
            ["Loss", "+0 (no penalty-loss bonus)"],
            ["Goals", "+ (goals, excl. shootout goals)"],
          ]} />
          <p className="text-sm font-semibold text-ink mt-2">Penalty shootout events (per kick)</p>
          <Scoring rows={[
            ["Kick off-target / hits post (untouched)", "−1"],
            ["Panenka attempt — missed or saved", "−1"],
            ["Panenka attempt — scored", "+1"],
          ]} />
          <p className="text-xs text-ink-3 mt-1">
            Panenka: a gentle chip up the middle, banking on the keeper diving to a side.
          </p>
        </Section>

        <Section title="Overall ranking">
          <p className="text-sm text-ink-2">Final ranking = group prediction points + knockout points.</p>
          <p className="text-sm text-ink-2 mt-2">Tiebreaker: combined knockout goal difference of your 3 drafted teams (goals for − goals against per team, summed).</p>
        </Section>

        <Section title="Rounds & dates">
          <Scoring rows={[
            ["Group stage", "Jun 11 – Jun 27"],
            ["Round of 32", "Jun 28 – Jul 3"],
            ["Round of 16", "Jul 4 – Jul 7"],
            ["Quarter-Finals", "Jul 9 – Jul 11"],
            ["Semi-Finals", "Jul 14 – Jul 15"],
            ["Bronze Final", "Jul 18"],
            ["Final", "Jul 19"],
          ]} />
        </Section>
      </Scroll>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="px-4 py-3 flex flex-col gap-2">
      <h2 className="font-display font-bold uppercase text-[18px] text-ink leading-none border-b border-line pb-2 mb-1">{title}</h2>
      {children}
    </Card>
  );
}

function Pot({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <Card tone="muted" className="px-3 py-2.5 flex flex-col gap-1">
      <p className="font-semibold text-ink text-sm">
        {badge} {title}
      </p>
      <p className="text-ink-2 text-xs leading-relaxed">{children}</p>
    </Card>
  );
}

function Scoring({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-xs mt-1">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-line">
            <td className="py-1.5 text-ink-2">{label}</td>
            <td className="py-1.5 text-right font-num font-bold text-brand-ink whitespace-nowrap pl-4">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
