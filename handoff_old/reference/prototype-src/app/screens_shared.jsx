/* ============================================================
   WC2026 Fantasy — SHARED group-phase screens
   Used by BOTH the review canvas and the full prototype.
   Predict · Standings (2 podiums) · Today · Payouts · Rules
   ============================================================ */

const outcomeOf = (h, a) => (h > a ? "W" : h < a ? "L" : "D");

/* ---------------- PREDICT (focused review + group selector) ---------------- */
function PredictReview({ wave = 1, startIdx = 5 }) {
  const matches = window.WC.groupAMatches;
  const [grp, setGrp] = React.useState("A");
  const [idx, setIdx] = React.useState(startIdx);
  const [picks, setPicks] = React.useState(() => matches.map(m => ({ ...m.pred })));
  const m = matches[idx];
  const played = !!m.result;
  const pk = picks[idx];
  const setPick = (side, d) => { if (played) return; setPicks(ps => ps.map((p, i) => i === idx ? { ...p, [side]: Math.max(0, Math.min(20, p[side] + d)) } : p)); };
  const exact = played && pk.h === m.result.h && pk.a === m.result.a;
  const rightOutcome = played && outcomeOf(pk.h, pk.a) === outcomeOf(m.result.h, m.result.a);
  // 3-way result theming
  const verdict = !played ? null : exact ? "green" : rightOutcome ? "gold" : "red";
  const vMap = {
    green: { soft: "var(--green-soft)", ink: "var(--green-ink)", pill: "green", label: "Exact +3" },
    gold:  { soft: "var(--gold-soft)",  ink: "var(--gold-ink)",  pill: "gold",  label: "Outcome +2" },
    red:   { soft: "var(--red-soft)",   ink: "var(--red-ink)",   pill: "red",   label: "Missed +0" },
  };
  const v = verdict ? vMap[verdict] : null;

  const teamBig = (code) => <div style={{ display: "grid", justifyItems: "center", gap: 9 }}>
    <CountryLogo code={code} size={62} />
    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, textTransform: "uppercase", textAlign: "center", lineHeight: 1 }}>{window.WC.T[code].name}</div>
  </div>;
  const stepBox = (side) => (
    <div style={{ display: "grid", justifyItems: "center", gap: 10, background: "var(--paper-2)", borderRadius: "var(--r-md)", padding: "14px 8px" }}>
      <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 50, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{pk[side]}</div>
      <div style={{ display: "flex", gap: 9 }}>
        <button onClick={() => setPick(side, -1)} style={{ width: 50, height: 50, borderRadius: 14, border: "1.5px solid var(--line-2)", background: "var(--surface)", fontSize: 27, fontWeight: 700, cursor: "pointer", color: "var(--ink)" }}>−</button>
        <button onClick={() => setPick(side, 1)} style={{ width: 50, height: 50, borderRadius: 14, border: "none", background: "var(--brand)", color: "var(--brand-on)", fontSize: 27, fontWeight: 700, cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
  // everyone's guesses for this match — you first, then by points
  const others = (m.others || []).slice().sort((a, b) => {
    if (a.sid === "you") return -1; if (b.sid === "you") return 1;
    return (b.pts ?? -1) - (a.pts ?? -1);
  });

  return <>
    <ScreenHeader title="Predict" sub={`Group ${grp} · review & set picks`} waveIntensity={wave}
      right={<Pill color="brand">3 / 6 set</Pill>} />
    <Scroll>
      {/* group selector */}
      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, margin: "0 -2px" }}>
        {window.WC.groups.map(g => {
          const on = g === grp;
          return <button key={g} onClick={() => { setGrp(g); setIdx(0); }} style={{ flex: "none", width: 46, height: 46, borderRadius: 13,
            border: on ? "1.5px solid var(--brand)" : "1.5px solid var(--line)", background: on ? "var(--brand)" : "var(--surface)",
            color: on ? "var(--brand-on)" : "var(--ink)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>{g}</button>;
        })}
      </div>
      {grp !== "A" && <Card style={{ padding: 20, textAlign: "center", color: "var(--ink-2)", fontSize: 13.5 }}>
        Group {grp} picks saved &amp; locked. <span style={{ color: "var(--ink-3)" }}>Group A shown as the live demo.</span></Card>}
      {grp === "A" && <>
        {/* match pager */}
        <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
          {matches.map((mm, i) => {
            const on = i === idx, done = !!mm.result;
            return <button key={i} onClick={() => setIdx(i)} style={{ flex: 1, minHeight: 46, padding: "5px 2px", borderRadius: 9, cursor: "pointer",
              border: on ? "1.5px solid var(--ink)" : "1px solid var(--line)", background: on ? "var(--ink)" : done ? "var(--paper-3)" : "var(--surface)",
              color: on ? "#fff" : "var(--ink-2)", fontSize: 11, fontWeight: 700, display: "grid", gap: 1, placeItems: "center", lineHeight: 1.15, position: "relative" }}>
              <span>{mm.home}</span>
              <span style={{ fontSize: 8, fontWeight: 600, opacity: 0.6 }}>v</span>
              <span>{mm.away}</span>
              <span style={{ position: "absolute", top: 4, right: 5, width: 6, height: 6, borderRadius: 999, background: done ? "var(--green)" : "var(--gold)" }} /></button>;
          })}
        </div>
        {/* focused match */}
        <Card style={{ padding: "16px 16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ color: "var(--ink-2)", fontSize: 12.5, fontWeight: 600 }}>{m.time.replace(/ · .*/, "")}</span>
            {played ? <Pill color={v.pill}>{v.label}</Pill> : <Pill color="brand">Upcoming</Pill>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, marginBottom: 18 }}>
            {teamBig(m.home)}<div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 20, color: "var(--ink-3)" }}>VS</div>{teamBig(m.away)}
          </div>
          {played ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "var(--paper-2)", borderRadius: "var(--r-md)", padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4 }}>Your pick</div>
                <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 32 }}>{pk.h} – {pk.a}</div>
              </div>
              <div style={{ background: v.soft, borderRadius: "var(--r-md)", padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", color: v.ink, textTransform: "uppercase", marginBottom: 4 }}>Result</div>
                <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 32, color: v.ink }}>{m.result.h} – {m.result.a}</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>{stepBox("h")}{stepBox("a")}</div>
              <Btn kind="primary" full style={{ minHeight: 50 }}>Save pick</Btn>
            </>
          )}
        </Card>
        {/* everyone's guesses (played) or prediction progress (upcoming) */}
        {played ? (
          <Card style={{ padding: "6px 8px 8px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", color: "var(--ink-3)", textTransform: "uppercase", padding: "10px 8px 6px" }}>How everyone guessed</div>
            {others.map((o, j) => {
              const you = o.sid === "you";
              return <div key={j} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px",
                borderRadius: "var(--r-sm)", background: you ? "var(--brand-soft)" : "transparent" }}>
                <div style={{ minWidth: 0, flex: 1 }}><UserName id={window.WC.shortId[o.sid]} you={you} size={26} /></div>
                <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 15, color: "var(--ink-2)", width: 52, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{o.h} – {o.a}</span>
                <span style={{ width: 34, textAlign: "right" }}><PtsBadge value={o.pts} /></span>
              </div>;
            })}
          </Card>
        ) : (
          <Banner tone="brand" icon="👥">7 of 10 friends have locked a pick for this match.</Banner>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} style={{ flex: 1, height: 44, borderRadius: 999, border: "1.5px solid var(--line-2)", background: "var(--surface)", fontWeight: 700, color: "var(--ink)", cursor: "pointer" }}>← Prev</button>
          <button onClick={() => setIdx(i => Math.min(matches.length - 1, i + 1))} style={{ flex: 1, height: 44, borderRadius: 999, border: "1.5px solid var(--line-2)", background: "var(--surface)", fontWeight: 700, color: "var(--ink)", cursor: "pointer" }}>Next →</button>
        </div>
      </>}
    </Scroll>
  </>;
}

/* ---------------- STANDINGS (points podium + efficiency podium) ---------------- */
function effValue(p) { return (p.eff.g + p.eff.a) / p.eff.min; }
function CardSwatch({ kind, size = 13 }) {
  return <span style={{ width: size * 0.72, height: size, borderRadius: 2, display: "inline-block", flex: "none",
    background: kind === "r" ? "var(--red)" : "#F4C430", boxShadow: "0 1px 1px rgba(0,0,0,.18)" }} />;
}
function CardCount({ kind, n }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, opacity: n ? 1 : 0.32,
    fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 13, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>    <CardSwatch kind={kind} />{n}</span>;
}
// Single owner chip — "picked by [avatar] Name". Avatar = uploaded photo fallback to monogram.
function OwnerTag({ id, prefix = "picked by", size = 17 }) {
  const p = window.WC.byId[id]; if (!p) return null;
  const you = id === "you";
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0, fontSize: 11.5, fontWeight: 600 }}>
    {prefix && <span style={{ color: "var(--ink-3)" }}>{prefix}</span>}
    <span style={{ width: size, height: size, borderRadius: 999, flex: "none", background: p.color, color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: size * 0.42, border: "1.5px solid rgba(255,255,255,.7)" }}>{p.initials}</span>
    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: you ? "var(--brand-ink)" : "var(--ink)", fontWeight: 700 }}>{you ? "You" : p.name}</span>
  </span>;
}
// Overlapping avatar stack for everyone who drafted a country.
function OwnerStack({ ids, size = 20 }) {
  if (!ids || !ids.length) return <span style={{ fontSize: 11, color: "var(--ink-3)", fontStyle: "italic" }}>undrafted</span>;
  return <span style={{ display: "inline-flex", alignItems: "center" }}>
    {ids.map((id, i) => { const p = window.WC.byId[id]; const isYou = id === "you";
      return <span key={id} title={isYou ? "You" : p.name} style={{ width: size, height: size, borderRadius: 999, flex: "none", background: p.color, color: "#fff",
        display: "grid", placeItems: "center", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: size * 0.4,
        border: isYou ? "2px solid var(--brand)" : "2px solid var(--surface)", marginLeft: i ? -7 : 0, position: "relative", zIndex: 20 - i }}>{p.initials}</span>; })}
  </span>;
}
function PodiumCard({ title, tone, entries, variant, valueColor }) {
  const toneMap = { gold: ["var(--gold-soft)", "var(--gold-line)", "var(--gold-ink)"], green: ["var(--green-soft)", "transparent", "var(--green-ink)"], red: ["var(--red-soft)", "transparent", "var(--red-ink)"] };
  const [bg, bd, fg] = toneMap[tone];
  return <Card style={{ padding: "16px 14px 14px", overflow: "hidden", background: bg, border: `1px solid ${bd}` }}>
    <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: fg, marginBottom: 14 }}>{title}</div>
    <Podium entries={entries} variant={variant} valueColor={valueColor} />
  </Card>;
}

function StandingsContent({ wave = 1, combined = false, only }) {
  const score = (p) => combined ? p.combined : p.groupPts;
  const byPts = [...window.WC.players].sort((a, b) => score(b) - score(a));
  const ptsEntries = byPts.slice(0, 3).map((p, i) => ({ place: i + 1, initials: p.initials, name: p.name.split(" ")[0], value: score(p), color: p.color }));
  const rest = byPts.slice(3);
  const byEff = [...window.WC.players].sort((a, b) => effValue(b) - effValue(a));
  const effEntries = byEff.slice(0, 3).map((p, i) => ({ place: i + 1,
    initials: p.eff.name.replace(/^[A-Z]\.\s*/, "").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase(),
    name: p.eff.name, sub: `${p.eff.g}G+${p.eff.a}A`, value: effValue(p).toFixed(4), color: p.color,
    owner: { name: p.id === "you" ? "You" : p.name.split(" ")[0], initials: p.initials, color: p.color } }));

  const showPoints = only !== "efficiency";
  const showEff = only !== "points";

  // 2nd Side Pot — Worst Discipline (knockout only)
  const byCards = [...window.WC.players].sort((a, b) => window.WC.playerCardPts(b) - window.WC.playerCardPts(a));
  const cardEntries = byCards.slice(0, 3).map((p, i) => ({ place: i + 1, initials: p.initials, name: p.name.split(" ")[0], value: window.WC.playerCardPts(p), color: p.color }));
  const byCountry = Object.keys(window.WC.koCards).sort((a, b) => window.WC.cardPtsOf(b) - window.WC.cardPtsOf(a));

  return <>
    <ScreenHeader title="Standings" sub={combined ? "Overall · group + knockout" : "72 / 72 matches played"} waveIntensity={wave}
      right={<Pill color="ink">{window.WC.players.length} players</Pill>} />
    <Scroll>
      {showPoints && <>
        <PodiumCard title="🏆 OVERALL LEADERS" tone="gold" entries={ptsEntries} variant="user" valueColor="var(--gold-ink)" />
        {rest.map((p, i) => {
          const you = p.id === "you";
          return <Card key={p.id} style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12,
            borderColor: you ? "var(--brand)" : "var(--line)", background: you ? "var(--brand-soft)" : "var(--surface)" }}>
            <span style={{ width: 24, textAlign: "center", color: "var(--ink-3)", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 15 }}>{i + 4}</span>
            <div style={{ flex: 1, minWidth: 0 }}><UserName id={p.id} you={you} /></div>
            <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 20 }}>{score(p)}<span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: 2 }}>pts</span></span>
          </Card>;
        })}
      </>}
      {showEff && <>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: showPoints ? "10px 2px 0" : "2px 2px 0" }}>
          <span style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, fontSize: 19, color: "var(--ink)" }}>Most Efficient Player</span>
          <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>1st Side Pot · $30 · highest (goals + assists) ÷ minutes</span>
        </div>
        <PodiumCard title="⚡ EFFICIENCY LEADERS" tone="green" entries={effEntries} variant="player" valueColor="var(--green-ink)" />
        {byEff.slice(3, 8).map((p, i) => (
          <Card key={p.id} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, textAlign: "center", color: "var(--ink-3)", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 15 }}>{i + 4}</span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <PlayerName name={p.eff.name} color={p.color} size={26} />
              <OwnerTag id={p.id} />
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 15, color: "var(--green-ink)" }}>{effValue(p).toFixed(4)}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{p.eff.g}G+{p.eff.a}A · {p.eff.min}m</div>
            </div>
          </Card>
        ))}
      </>}
      {combined && <>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 2px 0" }}>
          <span style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, fontSize: 19, color: "var(--ink)" }}>Worst Discipline</span>
          <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>2nd Side Pot · $30 · most card points by your 3 teams · knockout only</span>
        </div>
        <PodiumCard title="🟥 DISCIPLINE LEADERS" tone="red" entries={cardEntries} variant="user" valueColor="var(--red-ink)" />
        {byCards.slice(3, 8).map((p, i) => {
          const you = p.id === "you";
          return <Card key={p.id} style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12,
            borderColor: you ? "var(--brand)" : "var(--line)", background: you ? "var(--brand-soft)" : "var(--surface)" }}>
            <span style={{ width: 24, textAlign: "center", color: "var(--ink-3)", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 15 }}>{i + 4}</span>
            <div style={{ flex: 1, minWidth: 0 }}><UserName id={p.id} you={you} /></div>
            <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 20, color: "var(--red-ink)" }}>{window.WC.playerCardPts(p)}<span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: 2 }}>cp</span></span>
          </Card>;
        })}

        {/* Country card-points tracking — feeds the 2nd side pot */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px 11px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, fontSize: 15, color: "var(--ink)", letterSpacing: ".01em" }}>Country card points</span>
            <span style={{ display: "inline-flex", gap: 10, alignItems: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><CardSwatch kind="y" size={12} />= 1</span>
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><CardSwatch kind="r" size={12} />= 4</span>
            </span>
          </div>
          <div>
            {byCountry.map((c, i) => {
              const cd = window.WC.koCards[c];
              const mine = window.WC.byId.you.teams.includes(c);
              return <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px 10px 16px",
                borderTop: i ? "1px solid var(--line)" : "none", background: mine ? "var(--brand-soft)" : "transparent" }}>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                  <CountryName code={c} size={20} flag />
                  <span style={{ paddingLeft: 2 }}><OwnerStack ids={window.WC.draftersOf(c)} size={20} /></span>
                </div>
                <span style={{ display: "inline-flex", gap: 9, alignItems: "center", width: 70, justifyContent: "flex-end" }}>
                  <CardCount kind="y" n={cd.y} />
                  <CardCount kind="r" n={cd.r} />
                </span>
                <span style={{ width: 30, textAlign: "right", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 17, color: "var(--red-ink)", fontVariantNumeric: "tabular-nums" }}>{window.WC.cardPtsOf(c)}</span>
              </div>;
            })}
          </div>
        </Card>
      </>}
    </Scroll>
  </>;
}

/* ---------------- TODAY (results + everyone's picks, you prioritized) ---------------- */
function TodayScreen({ wave = 1 }) {
  const [view, setView] = React.useState("everyone");
  return <>
    <ScreenHeader title="Today" sub="Thursday, June 11" waveIntensity={wave} />
    <Scroll>
      <div style={{ display: "flex", background: "var(--paper-3)", borderRadius: 999, padding: 4, gap: 4 }}>
        {[["mine", "My picks"], ["everyone", "Everyone"]].map(([vv, l]) => (
          <button key={vv} onClick={() => setView(vv)} style={{ flex: 1, height: 38, borderRadius: 999, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 14, background: view === vv ? "var(--surface)" : "transparent",
            color: view === vv ? "var(--brand-ink)" : "var(--ink-2)", boxShadow: view === vv ? "var(--shadow-sm)" : "none" }}>{l}</button>
        ))}
      </div>
      {window.WC.todayGroup.map((g, i) => {
        const picks = g.picks.slice().sort((a, b) => (a.id === "you" ? -1 : b.id === "you" ? 1 : b.pts - a.pts));
        return <Card key={i} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px 14px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-3)", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              <span>{g.status}</span><span>Group {g.grp}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 0, justifySelf: "stretch", display: "flex", justifyContent: "flex-end" }}><CountryName code={g.home} /></div>
              <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 30, fontVariantNumeric: "tabular-nums", flex: "none" }}>{g.result.h}<span style={{ color: "var(--ink-3)", margin: "0 6px" }}>–</span>{g.result.a}</div>
              <div style={{ minWidth: 0, justifySelf: "stretch", display: "flex", justifyContent: "flex-start" }}><CountryName code={g.away} reverse /></div>
            </div>
          </div>
          <div style={{ padding: "6px 8px 8px" }}>
            {(view === "mine" ? picks.filter(p => p.id === "you") : picks).map((p, j) => {
              const you = p.id === "you";
              return <div key={j} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px",
                borderRadius: "var(--r-sm)", background: you ? "var(--brand-soft)" : "transparent" }}>
                <div style={{ minWidth: 0, flex: 1 }}><UserName id={window.WC.shortId[p.id]} you={you} size={26} /></div>
                <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 15, color: "var(--ink-2)", width: 52, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{p.h} – {p.a}</span>
                <span style={{ width: 34, textAlign: "right" }}><PtsBadge value={p.pts} /></span>
              </div>;
            })}
          </div>
        </Card>;
      })}
    </Scroll>
  </>;
}

/* ---------------- PAYOUTS ---------------- */
function PayoutsScreen({ wave = 1 }) {
  const P = window.WC.payouts;
  return <>
    <ScreenHeader title="Payouts" sub={`$${P.pool} pool · $${P.buyin} buy-in × ${P.count}`} waveIntensity={wave} />
    <Scroll>
      {P.inProgress && <Banner tone="gold" icon="⚠️">Tournament in progress — leaders are current, not final.</Banner>}
      {P.items.map((it, i) => {
        const isOverall = it.kind === "overall";
        const ru = window.WC.byId[it.runnerUp];
        return <Card key={i} tone={isOverall ? "gold" : undefined} style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", color: "var(--ink-2)", textTransform: "uppercase", marginBottom: 6 }}>{it.label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: isOverall ? 44 : 32, color: "var(--gold-ink)", lineHeight: 1 }}>${it.amount}</span>
            {isOverall && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold-ink)" }}>🏆 GRAND PRIZE</span>}
          </div>
          <UserName id={it.winner} size={isOverall ? 36 : 30} />
          <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            {isOverall ? "Points" : it.label.includes("Efficient") ? "Efficiency" : "Card points"}: <b style={{ color: "var(--ink)" }}>{it.detail}</b></div>
          <div style={{ color: "var(--ink-3)", fontSize: 12.5, marginTop: 8 }}>2nd: {ru.name}</div>
        </Card>;
      })}
      <div style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 13, padding: "8px 0" }}>Total pool ${P.pool} · ${P.buyin} × {P.count} players</div>
    </Scroll>
  </>;
}

/* ---------------- RULES ---------------- */
function RuleRow({ left, right }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px dashed var(--line)", fontSize: 14 }}>
    <span style={{ color: "var(--ink-2)" }}>{left}</span><span style={{ fontFamily: "var(--font-num)", fontWeight: 700, color: "var(--ink)", flex: "none" }}>{right}</span></div>;
}
function RuleSection({ title, children }) {
  return <div><h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 18, fontWeight: 700, color: "var(--brand-ink)", margin: "8px 0 6px" }}>{title}</h3>{children}</div>;
}
function RulesScreen({ wave = 1 }) {
  return <>
    <ScreenHeader title="Rulebook" sub="WC26 Fantasy Pool · Official rules" waveIntensity={wave} />
    <Scroll>
      <Card style={{ padding: 16 }}>
        <RuleSection title="Ways to win">
          <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
            <div style={{ background: "var(--gold-soft)", border: "1px solid var(--gold-line)", borderRadius: "var(--r-md)", padding: "12px 14px" }}>
              <b>🏆 Overall winner — $240.</b> <span style={{ color: "var(--ink-2)", fontSize: 13.5 }}>Most combined points (group + knockout). Tiebreaker: combined GD of your 3 drafted teams.</span></div>
            <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "12px 14px" }}>
              <b>⚡ 1st Side Pot — $30.</b> <span style={{ color: "var(--ink-2)", fontSize: 13.5 }}>Most efficient footballer: highest (goals + assists) / minutes. Admin-entered.</span></div>
            <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "12px 14px" }}>
              <b>🟨 2nd Side Pot — $30.</b> <span style={{ color: "var(--ink-2)", fontSize: 13.5 }}>Worst discipline (knockout only): most card points by your 3 teams. Yellow = 1 · Red = 4.</span></div>
          </div>
        </RuleSection>
      </Card>
      <Card style={{ padding: 16 }}>
        <RuleSection title="Group stage predictions">
          <p style={{ color: "var(--ink-2)", fontSize: 13.5, margin: "2px 0 8px" }}>Predict every group-stage scoreline (72). Locks at first kickoff.</p>
          <RuleRow left="Correct outcome (win/draw/loss)" right="+2" />
          <RuleRow left="Correct exact score" right="+1" />
          <RuleRow left="Maximum per match" right="+3" />
        </RuleSection>
      </Card>
      <Card style={{ padding: 16 }}>
        <RuleSection title="Knockout scoring">
          <RuleRow left="Your team wins" right="+2" />
          <RuleRow left="Your team loses a penalty shootout" right="+1" />
          <RuleRow left="Goals scored by your team" right="+ goals" />
          <RuleRow left="Panenka scored / missed" right="+1 / −1" />
        </RuleSection>
      </Card>
      <Card style={{ padding: 16 }}>
        <RuleSection title="Rounds & dates">
          <RuleRow left="Group stage" right="Jun 11 – 27" />
          <RuleRow left="Round of 32" right="Jun 28 – Jul 3" />
          <RuleRow left="Round of 16" right="Jul 4 – 7" />
          <RuleRow left="Quarter-Finals" right="Jul 9 – 11" />
          <RuleRow left="Semi-Finals" right="Jul 14 – 15" />
          <RuleRow left="Final" right="Jul 19" />
        </RuleSection>
      </Card>
    </Scroll>
  </>;
}

Object.assign(window, { PredictReview, StandingsContent, TodayScreen, PayoutsScreen, RulesScreen, effValue, PodiumCard });
