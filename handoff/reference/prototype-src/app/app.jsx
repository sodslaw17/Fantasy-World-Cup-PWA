/* ============================================================
   WC2026 Fantasy — App shell
   Phase switch · per-user flag theming (live AA guardrail) ·
   bottom-tab nav · Tweaks
   ============================================================ */

const { useState, useMemo } = React;

// mix hex a→b by t (0..1)
function mixHex(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return "#" + c(r1, r2) + c(g1, g2) + c(b1, b2);
}

// Build AA-safe brand vars for any primary/secondary against the active base.
function computeBrand(primary, secondary, base) {
  const surface = base === "dark" ? "#16181F" : "#FFFFFF";
  return {
    "--brand": primary,
    "--brand-ink": ensureContrast(primary, surface, 4.5),
    "--brand-on": onColor(primary),
    "--brand-soft": mixHex(primary, surface, base === "dark" ? 0.82 : 0.88),
    "--brand-2": secondary,
    "--brand-2-ink": ensureContrast(secondary, surface, 4.5),
  };
}

const GROUP_ACCENTS = {
  blue:  ["#0A3D91", "#E4002B"],
  red:   ["#E4002B", "#0A3D91"],
  green: ["#008A52", "#0A3D91"],
};

const PHASES = [
  { id: "group",    label: "Group Stage" },
  { id: "predraft", label: "Pre-Draft" },
  { id: "knockout", label: "Knockout" },
];

const TABS = {
  group: [
    { id: "standings", label: "Standings", icon: "standings" },
    { id: "today", label: "Today", icon: "today" },
    { id: "predict", label: "Predict", icon: "predict" },
    { id: "payouts", label: "Payouts", icon: "payouts" },
    { id: "rules", label: "Rules", icon: "rules" },
  ],
  predraft: [
    { id: "standings", label: "Standings", icon: "standings" },
    { id: "today", label: "Today", icon: "today" },
    { id: "draft", label: "Draft", icon: "draft" },
    { id: "payouts", label: "Payouts", icon: "payouts" },
    { id: "rules", label: "Rules", icon: "rules" },
  ],
  knockout: [
    { id: "standings", label: "Standings", icon: "standings" },
    { id: "today", label: "Today", icon: "today" },
    { id: "bracket", label: "Bracket", icon: "bracket" },
    { id: "myteam", label: "My Team", icon: "myteam" },
    { id: "payouts", label: "Payouts", icon: "payouts" },
    { id: "rules", label: "Rules", icon: "rules" },
  ],
};

const FONT_STACKS = {
  "Saira Condensed": '"Saira Condensed", "Hanken Grotesk", sans-serif',
  "Oswald": '"Oswald", "Hanken Grotesk", sans-serif',
  "Archivo": '"Archivo", "Hanken Grotesk", sans-serif',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "base": "light",
  "wave": 100,
  "displayFont": "Saira Condensed",
  "groupAccent": "blue"
}/*EDITMODE-END*/;

function PredraftToday({ wave }) {
  return (
    <>
      <ScreenHeader title="Today" sub="Group stage complete" waveIntensity={wave} />
      <Scroll>
        <Card style={{ padding: "30px 22px", textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>🏟️</div>
          <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 20, fontWeight: 700 }}>No matches today</h3>
          <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.5 }}>The group stage is finished. Knockout fixtures appear here once the Round of 32 begins on June 28.</p>
        </Card>
        <Card style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📲</span>
          <div style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Head to the <b style={{ color: "var(--brand-ink)" }}>Draft</b> tab for your standby info and draft position.</div>
        </Card>
      </Scroll>
    </>
  );
}

function DraftReminderBar({ onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", border: "none",
      cursor: "pointer", background: "var(--brand)", color: "var(--brand-on)", padding: "0 16px", minHeight: 50,
      borderTop: "1px solid rgba(255,255,255,.14)", WebkitTapHighlightColor: "transparent", textAlign: "left" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: "none" }}>
        <rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3h6v3H9zM8.5 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ flex: 1, minWidth: 0, lineHeight: 1.15 }}>
        <span style={{ display: "block", fontWeight: 800, fontSize: 14 }}>Set your draft order</span>
        <span style={{ display: "block", fontSize: 11.5, opacity: .85, fontWeight: 600 }}>Rank positions &amp; team wishlist before the draft</span>
      </span>
      <span style={{ flex: "none", fontSize: 20, fontWeight: 700 }}>›</span>
    </button>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [phase, setPhase] = useState("group");
  const [tab, setTab] = useState("standings");
  const [viewer, setViewer] = useState("alice-martinez"); // knockout persona
  const [prefsOpen, setPrefsOpen] = useState(false);       // Draft Preferences takeover

  const tabs = TABS[phase];
  React.useEffect(() => { if (!tabs.find(x => x.id === tab)) setTab(tabs[0].id); setPrefsOpen(false); }, [phase]);

  // ---- active theme ----
  const persona = window.WC.personas.find(p => p.id === viewer) || window.WC.personas[2];
  const themeVars = useMemo(() => {
    if (phase === "knockout") {
      const team = window.WC.T[persona.team].theme;
      return computeBrand(team.p, team.s, t.base);
    }
    const [p, s] = GROUP_ACCENTS[t.groupAccent] || GROUP_ACCENTS.blue;
    return computeBrand(p, s, t.base);
  }, [phase, viewer, t.base, t.groupAccent]);

  const wave = t.wave / 100;

  const screenStyle = {
    ...themeVars,
    "--font-display": FONT_STACKS[t.displayFont],
    color: "var(--ink)",
  };

  const showDraftCTA = (phase === "group" || phase === "predraft") && !prefsOpen;

  const renderScreen = () => {
    if (phase === "group") {
      switch (tab) {
        case "standings": return <StandingsContent wave={wave} />;
        case "today": return <TodayScreen wave={wave} />;
        case "predict": return <PredictReview wave={wave} startIdx={0} />;
        case "payouts": return <PayoutsScreen wave={wave} />;
        case "rules": return <RulesScreen wave={wave} />;
      }
    }
    if (phase === "predraft") {
      switch (tab) {
        case "standings": return <StandingsContent wave={wave} />;
        case "today": return <PredraftToday wave={wave} />;
        case "draft": return <StandbyScreen wave={wave} />;
        case "payouts": return <PayoutsScreen wave={wave} />;
        case "rules": return <RulesScreen wave={wave} />;
      }
    }
    // knockout
    switch (tab) {
      case "standings": return <StandingsContent wave={wave} combined />;
      case "today": return <KnockoutTodayScreen wave={wave} viewer={viewer} />;
      case "bracket": return <BracketScreen wave={wave} viewer={viewer} />;
      case "myteam": return <MyTeamScreen wave={wave} viewer={viewer} />;
      case "payouts": return <PayoutsScreen wave={wave} />;
      case "rules": return <RulesScreen wave={wave} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start",
      justifyContent: "center", padding: "32px 24px 64px", background: "var(--stage)" }}>

      {/* ---- control rail ---- */}
      <div style={{ width: 320, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 32 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, fontSize: 26, letterSpacing: ".01em", color: "#14151A", lineHeight: 1 }}>WC2026 Fantasy</div>
          <div style={{ color: "#565D6E", fontSize: 13.5, marginTop: 6 }}>Interactive prototype — switch the tournament phase to see how the app reshapes itself.</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E4E7ED", borderRadius: 18, padding: 16, boxShadow: "0 4px 14px rgba(20,21,26,.06)" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", color: "#565D6E", textTransform: "uppercase", marginBottom: 8 }}>Tournament phase</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PHASES.map(p => {
              const on = p.id === phase;
              return <button key={p.id} onClick={() => setPhase(p.id)} style={{ textAlign: "left", cursor: "pointer",
                border: on ? "1.5px solid #0A3D91" : "1.5px solid #E4E7ED", background: on ? "#E7EDF7" : "#fff",
                color: on ? "#0A3D91" : "#14151A", borderRadius: 12, padding: "11px 14px", fontWeight: 700, fontSize: 14.5,
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {p.label}{on && <span style={{ fontSize: 12 }}>●</span>}</button>;
            })}
          </div>
        </div>

        {phase === "knockout" && (
          <div style={{ background: "#fff", border: "1px solid #E4E7ED", borderRadius: 18, padding: 16, boxShadow: "0 4px 14px rgba(20,21,26,.06)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", color: "#565D6E", textTransform: "uppercase", marginBottom: 4 }}>Viewing as</div>
            <div style={{ fontSize: 12.5, color: "#565D6E", marginBottom: 10 }}>Each user's accent switches to their first drafted country's flag — auto-corrected to pass WCAG AA.</div>
            <div style={{ display: "grid", gap: 6 }}>
              {window.WC.personas.map(p => {
                const on = p.id === viewer;
                const th = window.WC.T[p.team].theme;
                return <button key={p.id} onClick={() => setViewer(p.id)} style={{ cursor: "pointer", textAlign: "left",
                  border: on ? "1.5px solid #14151A" : "1.5px solid #E4E7ED", background: on ? "#F5F6F9" : "#fff",
                  borderRadius: 12, padding: "9px 11px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 30, height: 22, borderRadius: 5, overflow: "hidden", border: "1px solid #D3D7E0", flex: "none" }}><Flag code={p.team} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 700, fontSize: 13.5, color: "#14151A" }}>{p.label}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#8A90A0" }}>{p.note}</span>
                  </span>
                  {on && <span style={{ width: 14, height: 14, borderRadius: 999, background: th.p, flex: "none", border: "1px solid rgba(0,0,0,.1)" }} />}
                </button>;
              })}
            </div>
          </div>
        )}

        <div style={{ fontSize: 12, color: "#8A90A0", lineHeight: 1.5, padding: "0 2px" }}>
          Tap the bottom tabs to move between screens. Open <b style={{ color: "#565D6E" }}>Tweaks</b> (toolbar) for base mode, wave intensity, type &amp; accent.
        </div>
      </div>

      {/* ---- phone ---- */}
      <div data-base={t.base} style={screenStyle}>
        <PhoneFrame>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "var(--paper)" }}>
            <div key={prefsOpen ? "prefs" : phase + tab} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, animation: "fade .28s ease" }}>
              {prefsOpen ? <DraftPrefsScreen wave={wave} onClose={() => setPrefsOpen(false)} /> : renderScreen()}
            </div>
            {showDraftCTA && <DraftReminderBar onClick={() => setPrefsOpen(true)} />}
            <TabBar tabs={tabs} active={prefsOpen ? null : tab} onSelect={(id) => { setPrefsOpen(false); setTab(id); }} />
          </div>
        </PhoneFrame>
      </div>

      {/* ---- Tweaks ---- */}
      <TweaksPanel>
        <TweakSection label="Base" />
        <TweakRadio label="Mode" value={t.base} options={["light", "dark"]} onChange={(v) => setTweak("base", v)} />
        <TweakSection label="TRIONDA styling" />
        <TweakSlider label="Wave intensity" value={t.wave} min={0} max={100} unit="%" onChange={(v) => setTweak("wave", v)} />
        <TweakSelect label="Display type" value={t.displayFont} options={Object.keys(FONT_STACKS)} onChange={(v) => setTweak("displayFont", v)} />
        <TweakSection label="Group-phase accent" />
        <TweakColor label="Accent" value={t.groupAccent === "blue" ? "#0A3D91" : t.groupAccent === "red" ? "#E4002B" : "#008A52"}
          options={["#0A3D91", "#E4002B", "#008A52"]}
          onChange={(hex) => setTweak("groupAccent", hex === "#0A3D91" ? "blue" : hex === "#E4002B" ? "red" : "green")} />
        <div style={{ fontSize: 11.5, color: "var(--ink-3, #8A90A0)", padding: "4px 2px 0", lineHeight: 1.5 }}>
          In Knockout the accent is driven by each user's flag instead — switch personas on the left.
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
