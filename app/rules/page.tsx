export const metadata = { title: "Rules — WC26 Pool" };

export default function RulesPage() {
  return (
    <div className="min-h-screen pb-28">
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold text-gold">Rulebook</h1>
        <p className="text-xs text-paper/50">WC26 Fantasy Pool · Official rules</p>
      </header>

      <div className="px-4 space-y-6 text-sm">

        <Section title="Buy-in">
          <p>Buy-in is <strong>$30 per player</strong>.</p>
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
          <p>Predict the scoreline of every group-stage match (72 total). Must be submitted before the first kick-off on June 11. Predictions lock server-side at that moment — you cannot edit after.</p>
          <Scoring rows={[
            ["Correct outcome (win/draw/loss)", "+2"],
            ["Correct exact score", "+1 (on top of the +2)"],
            ["Wrong outcome", "+0"],
            ["Maximum per match", "+3"],
          ]} />
          <p className="mt-2 text-paper/60 text-xs">
            Worked example — actual: Mexico 1 – 2 South Africa
          </p>
          <Scoring rows={[
            ["Predicted MEX 2–1 RSA (wrong outcome)", "0"],
            ["Predicted MEX 1–3 RSA (correct outcome)", "2"],
            ["Predicted MEX 1–2 RSA (exact)", "3"],
          ]} />
          <p className="mt-2">Group stage tiebreaker: closest predicted total goals across all 72 matches. If equidistant, lower predicted total wins.</p>
        </Section>

        <Section title="Post-group snake draft">
          <p>Group stage totals determine draft pick order. Highest scorer picks their snake position first. Positions are chosen, then teams are drafted from the Round of 32.</p>
          <p className="mt-2">With 10 players: <strong>3 teams per player</strong> (30 of the 32 teams drafted; 2 go undrafted).</p>
          <p className="mt-2">The draft runs over SMS. The app records the locked results — it does not run a live draft.</p>
        </Section>

        <Section title="Knockout scoring">
          <p>Points per drafted team, per match:</p>
          <Scoring rows={[
            ["Your team wins the game", "+2"],
            ["Your team loses a penalty shootout", "+1"],
            ["Your team loses in open play / ET", "+0"],
            ["Goals scored by your team", "+ (goals, excl. shootout goals)"],
          ]} />
          <p className="mt-2 font-medium">3rd place / Bronze Final</p>
          <Scoring rows={[
            ["Win", "+1 (not +2)"],
            ["Loss", "+0 (no penalty-loss bonus)"],
            ["Goals", "+ (goals, excl. shootout goals)"],
          ]} />
          <p className="mt-2 font-medium">Penalty shootout events (per kick)</p>
          <Scoring rows={[
            ["Kick off-target / hits post (untouched)", "−1"],
            ["Panenka attempt — missed or saved", "−1"],
            ["Panenka attempt — scored", "+1"],
          ]} />
          <p className="text-xs text-paper/50 mt-1">
            Panenka: a gentle chip up the middle, banking on the keeper diving to a side.
          </p>
        </Section>

        <Section title="Overall ranking">
          <p>Final ranking = group prediction points + knockout points.</p>
          <p className="mt-2">Tiebreaker: combined knockout goal difference of your 3 drafted teams (goals for − goals against per team, summed).</p>
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

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-bold text-gold border-b border-gold/20 pb-1">{title}</h2>
      <div className="space-y-2 text-paper/80">{children}</div>
    </div>
  );
}

function Pot({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-ink-soft border border-paper/10 p-3 space-y-1">
      <p className="font-semibold text-paper">
        {badge} {title}
      </p>
      <p className="text-paper/70 text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function Scoring({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-xs mt-1">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-paper/5">
            <td className="py-1 text-paper/70">{label}</td>
            <td className="py-1 text-right font-mono font-bold text-gold whitespace-nowrap pl-4">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
