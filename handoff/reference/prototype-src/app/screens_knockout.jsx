/* ============================================================
   WC2026 Fantasy — PRE-DRAFT & KNOCKOUT screens
   Standby · Who plays today · My Team · (Standings reused, combined)
   ============================================================ */

/* ---------------- PRE-DRAFT STANDBY ---------------- */
function useCountdown(targetISO) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  let d = Math.max(0, new Date(targetISO).getTime() - now);
  const days = Math.floor(d / 864e5); d -= days * 864e5;
  const hrs = Math.floor(d / 36e5); d -= hrs * 36e5;
  const mins = Math.floor(d / 6e4); d -= mins * 6e4;
  const secs = Math.floor(d / 1e3);
  return { days, hrs, mins, secs };
}

function StandbyScreen({ wave }) {
  const c = useCountdown("2026-06-28T16:00:00Z");
  const S = window.WC.standby;
  const you = window.WC.byId["you"];
  const order = [...window.WC.players].sort((a, b) => b.groupPts - a.groupPts);
  const youPos = order.findIndex(p => p.id === "you") + 1;
  const unit = (v, l) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 34, lineHeight: 1, color: "var(--brand-on)", fontVariantNumeric: "tabular-nums" }}>{String(v).padStart(2, "0")}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", color: "var(--brand-on)", opacity: .75, marginTop: 4 }}>{l}</div>
    </div>
  );
  return (
    <>
      <ScreenHeader title="Draft Standby" sub="Pre-draft · Jun 28 morning" waveIntensity={wave} />
      <Scroll>
        {/* hero countdown */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "var(--r-lg)", background: "var(--ink)", padding: "22px 20px 24px", boxShadow: "var(--shadow-md)" }}>
          <svg viewBox="0 0 390 120" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .5 }}>
            <path d="M0 70 Q97 40 195 70 T390 70 V120 H0 Z" fill="#0A3D91" /><path d="M0 84 Q97 54 195 84 T390 84 V120 H0 Z" fill="#008A52" /><path d="M0 98 Q97 68 195 98 T390 98 V120 H0 Z" fill="#E4002B" />
          </svg>
          <div style={{ position: "relative" }}>
            <div style={{ color: "var(--gold)", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>◆ Knockout kicks off in</div>
            <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 280 }}>
              {unit(c.days, "DAYS")}{unit(c.hrs, "HRS")}{unit(c.mins, "MIN")}{unit(c.secs, "SEC")}
            </div>
          </div>
        </div>
        <Banner tone="brand" icon="📲">Watch your phone — the snake draft runs over SMS.</Banner>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🏁</span>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 18, fontWeight: 700 }}>What happens next</h3>
          </div>
          <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>{S.body}</p>
        </Card>
        <Card tone="gold" style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", color: "var(--gold-ink)", textTransform: "uppercase" }}>Your draft position</div>
            <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 4 }}>Set by your group-stage rank</div>
          </div>
          <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 38, color: "var(--gold-ink)" }}>#{youPos}</div>
        </Card>
        <div style={{ color: "var(--ink-3)", fontSize: 12.5, textAlign: "center", padding: "2px 8px" }}>
          With 10 players you'll draft <b style={{ color: "var(--ink-2)" }}>3 teams</b> from the Round of 32.
        </div>
      </Scroll>
    </>
  );
}

/* ---------------- WHO PLAYS TODAY (knockout) ---------------- */
function DrafterChips({ code, viewerTeams }) {
  const ids = window.WC.draftersOf(code);
  if (!ids.length) return <span style={{ fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" }}>undrafted</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: -6 }}>
      {ids.map((id, i) => {
        const p = window.WC.byId[id];
        return <span key={id} title={p.name} style={{ width: 24, height: 24, borderRadius: 999, background: p.color, color: "#fff",
          display: "grid", placeItems: "center", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 10,
          border: "2px solid var(--surface)", marginLeft: i ? -7 : 0 }}>{p.initials}</span>;
      })}
    </div>
  );
}

function KnockoutTodayScreen({ wave, viewer }) {
  const K = window.WC.knockoutToday;
  const me = window.WC.byId[viewer] || window.WC.byId["you"];
  const mine = me.teams;
  return (
    <>
      <ScreenHeader title="Who Plays Today" sub={`${K.round} · ${K.date}`} waveIntensity={wave} brandTinted />
      <Scroll>
        {K.matches.map((m, i) => {
          const yourHome = mine.includes(m.home), yourAway = mine.includes(m.away);
          const youIn = yourHome || yourAway;
          return (
            <Card key={i} style={{ padding: 0, overflow: "hidden", borderColor: youIn ? "var(--brand)" : "var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: youIn ? "var(--brand-soft)" : "var(--paper-2)", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: youIn ? "var(--brand-ink)" : "var(--ink-2)" }}>{youIn ? "★ YOUR TEAM IN PLAY" : "Round of 32"}</span>
                {m.status === "live"
                  ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--red-ink)", fontSize: 12, fontWeight: 700 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--red)", display: "inline-block" }} />LIVE {m.minute}</span>
                  : <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>{m.time}</span>}
              </div>
              <div style={{ padding: "14px 16px" }}>
                {[["home", m.home, yourHome], ["away", m.away, yourAway]].map(([side, code, isYours], k) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0" }}>
                    <CountryStacked code={code} big />
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <DrafterChips code={code} />
                      {m.result && <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 28, fontVariantNumeric: "tabular-nums", color: isYours ? "var(--brand-ink)" : "var(--ink)" }}>{m.result[side[0] === "h" ? "h" : "a"]}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-3)", fontSize: 12.5, padding: "4px 6px" }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--brand-soft)", border: "1px solid var(--brand)", flex: "none" }} />
          Cards with a colored edge include one of your drafted teams.
        </div>
      </Scroll>
    </>
  );
}

/* ---------------- MY TEAM (knockout) ---------------- */
function MyTeamScreen({ wave, viewer }) {
  const me = window.WC.byId[viewer] || window.WC.byId["you"];
  const koPerTeam = [
    { code: me.teams[0], pts: 6, gd: "+3", note: "Won R32 · 3 goals" },
    { code: me.teams[1], pts: 4, gd: "+1", note: "Won R32 · 2 goals" },
    { code: me.teams[2], pts: 2, gd: "−1", note: "Lost on penalties" },
  ];
  const eff = me.eff;
  return (
    <>
      <ScreenHeader title="My Team" sub={`${me.name} · knockout`} waveIntensity={wave} brandTinted
        right={<Pill color="brand">★ themed</Pill>} />
      <Scroll>
        <Card style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: "var(--brand-soft)", border: "1px solid transparent" }}>
          <div style={{ width: 46, height: 34, borderRadius: 7, overflow: "hidden", border: "1px solid var(--line-2)", flex: "none" }}><Flag code={me.teams[0]} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--brand-ink)", fontWeight: 700, letterSpacing: ".03em" }}>FIRST PICK — DRIVES YOUR THEME</div>
            <div style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 20, fontWeight: 700, marginTop: 2 }}>{window.WC.T[me.teams[0]].name}</div>
          </div>
        </Card>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", letterSpacing: ".05em", textTransform: "uppercase", margin: "4px 4px -2px" }}>Your 3 drafted teams</div>
        {koPerTeam.map((t, i) => (
          <Card key={i} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, color: "var(--ink-3)", fontSize: 13, width: 18 }}>{i + 1}</span>
            <CountryStacked code={t.code} />
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 20 }}>{t.pts}<span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: 2 }}>pts</span></div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>GD {t.gd}</div>
            </div>
          </Card>
        ))}
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", letterSpacing: ".05em", textTransform: "uppercase", margin: "8px 4px -2px" }}>1st Side Pot — your footballer</div>
        <Card style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <PlayerName name={eff.name} color="var(--ink)" size={38} />
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 18, color: "var(--green-ink)" }}>{((eff.g + eff.a) / eff.min).toFixed(4)}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{eff.g}G + {eff.a}A / {eff.min}m</div>
          </div>
        </Card>
      </Scroll>
    </>
  );
}

Object.assign(window, { StandbyScreen, KnockoutTodayScreen, MyTeamScreen, DrafterChips, useCountdown });
