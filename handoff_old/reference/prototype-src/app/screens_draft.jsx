/* ============================================================
   WC2026 Fantasy — DRAFT PREFERENCES + KNOCKOUT BRACKET
   ReorderList (touch drag-to-rank) · DraftPrefsScreen · BracketScreen
   ============================================================ */

/* -------------------------------------------------------------
   REORDER LIST — pointer/touch drag-to-rank with live reordering.
   `items` = array of stable string keys. renderRow(key, rank, handlers)
   must spread {...handlers} onto the drag handle (touch-action:none).
------------------------------------------------------------- */
function ReorderList({ items, rowGap = 8, renderRow }) {
  const [order, setOrder] = React.useState(items);
  React.useEffect(() => { setOrder(items); }, [items.join("|")]);
  const wrapRef = React.useRef(null);
  const st = React.useRef(null);
  const [drag, setDrag] = React.useState({ key: null, dy: 0 });

  const begin = (e, key) => {
    const rows = [...wrapRef.current.children];
    const startIdx = order.indexOf(key);
    const rect = rows[startIdx].getBoundingClientRect();
    st.current = { key, startIdx, idx: startIdx, startY: e.clientY, unit: rect.height + rowGap };
    setDrag({ key, dy: 0 });
    try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  };
  const move = (e) => {
    if (!st.current) return;
    const dy = e.clientY - st.current.startY;
    let ni = st.current.startIdx + Math.round(dy / st.current.unit);
    ni = Math.max(0, Math.min(order.length - 1, ni));
    if (ni !== st.current.idx) {
      setOrder(o => { const a = [...o]; const cur = a.indexOf(st.current.key); a.splice(cur, 1); a.splice(ni, 0, st.current.key); return a; });
      st.current.idx = ni;
    }
    setDrag(d => ({ ...d, dy }));
  };
  const end = () => { st.current = null; setDrag({ key: null, dy: 0 }); };

  return (
    <div ref={wrapRef} style={{ display: "flex", flexDirection: "column", gap: rowGap, position: "relative" }}>
      {order.map((key, i) => {
        const dragging = drag.key === key;
        const visualDy = dragging && st.current ? (drag.dy - (st.current.idx - st.current.startIdx) * st.current.unit) : 0;
        const handlers = { onPointerDown: (e) => begin(e, key), onPointerMove: move, onPointerUp: end, onPointerCancel: end,
          style: { touchAction: "none", cursor: dragging ? "grabbing" : "grab" } };
        return (
          <div key={key} style={{ position: "relative", zIndex: dragging ? 5 : 1,
            transform: dragging ? `translateY(${visualDy}px) scale(1.015)` : "none",
            transition: dragging ? "none" : "transform .18s cubic-bezier(.2,.8,.2,1)",
            boxShadow: dragging ? "var(--shadow-lg)" : "none", borderRadius: "var(--r-md)" }}>
            {renderRow(key, i, handlers)}
          </div>
        );
      })}
    </div>
  );
}

// the 6-dot drag affordance
function Grip(props) {
  return (
    <span {...props} style={{ ...props.style, flex: "none", width: 30, height: 44, display: "grid", placeItems: "center",
      color: "var(--ink-3)", WebkitTapHighlightColor: "transparent" }}>
      <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
        {[3, 9, 15].map(y => [2.5, 9.5].map(x => <circle key={x + "-" + y} cx={x} cy={y} r="1.5" />))}
      </svg>
    </span>
  );
}

/* -------------------------------------------------------------
   DRAFT PREFERENCES — snake-position ranking + team wishlist
------------------------------------------------------------- */
function DraftPrefsScreen({ wave = 1, onClose }) {
  const N = 10;
  const positions = Array.from({ length: N }, (_, i) => "p" + (i + 1));
  // snake draft over 3 rounds for 10 players: pos p → picks p, (2N+1−p), (2N+p)
  const picksFor = (p) => [p, (2 * N + 1) - p, (2 * N) + p];
  const teams = window.WC.fifaOrder;

  return (
    <>
      <ScreenHeader title="Draft Order" sub="Positions &amp; team wishlist" waveIntensity={wave}
        right={<button onClick={onClose} style={{ border: "none", cursor: "pointer", background: "var(--brand)",
          color: "var(--brand-on)", fontWeight: 800, fontSize: 13.5, height: 36, padding: "0 18px", borderRadius: 999 }}>Done</button>} />
      <Scroll>
        <p style={{ margin: "0 2px", color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.5 }}>
          Record your snake-draft position preference and team wishlist. These are for your own planning — admins only access them if you're unavailable during the draft.
        </p>

        {/* ---- position preference ---- */}
        <div style={{ margin: "8px 2px -2px" }}>
          <div style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>Draft position preference</div>
          <div style={{ color: "var(--ink-2)", fontSize: 12.5, marginTop: 3, lineHeight: 1.45 }}>Drag to rank positions, most to least preferred. Each row shows the overall picks that position gets.</div>
        </div>
        <ReorderList items={positions} rowGap={8} renderRow={(key, rank, h) => {
          const p = parseInt(key.slice(1), 10);
          const picks = picksFor(p);
          const top = rank === 0;
          return (
            <div style={{ display: "flex", alignItems: "center", background: "var(--surface)",
              border: `1.5px solid ${top ? "var(--brand)" : "var(--line)"}`, borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow-sm)", overflow: "hidden", paddingRight: 14 }}>
              <Grip {...h} />
              <span style={{ width: 30, textAlign: "center", flex: "none", fontFamily: "var(--font-num)", fontWeight: 700,
                fontSize: 18, color: top ? "var(--brand-ink)" : "var(--ink-3)" }}>{rank + 1}</span>
              <div style={{ flex: 1, minWidth: 0, padding: "11px 0 11px 8px" }}>
                <div style={{ fontWeight: 700, fontSize: 15.5, color: "var(--ink)" }}>Position {p}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 1 }}>picks {picks.join(", ")}</div>
              </div>
            </div>
          );
        }} />

        {/* ---- team wishlist ---- */}
        <div style={{ margin: "14px 2px -2px" }}>
          <div style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>Team preference order</div>
          <div style={{ color: "var(--ink-2)", fontSize: 12.5, marginTop: 3, lineHeight: 1.45 }}>Drag to rank teams, most to least wanted. Default is FIFA ranking. Hold briefly, then drag.</div>
        </div>
        <ReorderList items={teams} rowGap={7} renderRow={(code, rank, h) => {
          const team = window.WC.T[code];
          return (
            <div style={{ display: "flex", alignItems: "center", background: "var(--surface)",
              border: "1px solid var(--line)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-sm)",
              overflow: "hidden", paddingRight: 14 }}>
              <Grip {...h} />
              <span style={{ width: 26, textAlign: "center", flex: "none", fontFamily: "var(--font-num)", fontWeight: 700,
                fontSize: 15, color: "var(--ink-3)" }}>{rank + 1}</span>
              <span style={{ flex: "none", margin: "0 4px 0 4px" }}><CountryLogo code={code} size={26} /></span>
              <div style={{ flex: 1, minWidth: 0, padding: "10px 0", display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 12, color: "var(--ink-3)", flex: "none", width: 32 }}>{code}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</span>
              </div>
            </div>
          );
        }} />
        <div style={{ color: "var(--ink-3)", fontSize: 12, textAlign: "center", padding: "4px 8px 2px", lineHeight: 1.5 }}>
          Saved automatically. Update any time before the draft locks on June 28.
        </div>
      </Scroll>
    </>
  );
}

/* -------------------------------------------------------------
   KNOCKOUT BRACKET — round-by-round, mobile-first
------------------------------------------------------------- */
function BracketScreen({ wave = 1, viewer }) {
  const B = window.WC.bracket;
  const me = window.WC.byId[viewer] || window.WC.byId["you"];
  const mine = me.teams || [];
  const [round, setRound] = React.useState("r32");
  const [hi, setHi] = React.useState(null); // highlighted team code

  // index every match by id, resolve helpers
  const mById = React.useMemo(() => {
    const m = {}; B.rounds.forEach(r => r.matches.forEach(x => { m[x.id] = x; x._round = r.id; })); return m;
  }, []);
  const labelOf = (rid) => B.rounds.find(r => r.id === rid).short;
  const resolve = (slot) => {
    if (!slot) return null;
    if (typeof slot === "string") return slot;
    const m = mById[slot.win]; return m && m.winner ? m.winner : null;
  };
  const canReach = (slot, team) => {
    if (!slot || !team) return false;
    if (typeof slot === "string") return slot === team;
    const m = mById[slot.win]; if (!m) return false;
    return canReach(m.home, team) || canReach(m.away, team);
  };
  const nextOf = (id) => {
    for (const r of B.rounds) for (const m of r.matches)
      if ((m.home && m.home.win === id) || (m.away && m.away.win === id)) return { round: r.id, match: m };
    return null;
  };
  const roundInvolves = (rid, team) => team && B.rounds.find(r => r.id === rid).matches
    .some(m => canReach(m.home, team) || canReach(m.away, team));

  const rd = B.rounds.find(r => r.id === round);

  // one team line inside a match card
  const SlotRow = ({ slot, m, side }) => {
    const code = resolve(slot);
    const isWin = code && m.winner === code;
    const isMine = code && mine.includes(code);
    const isHi = code && hi === code;
    const cand = !code && slot && slot.win ? [resolve(mById[slot.win].home), resolve(mById[slot.win].away)] : null;
    const score = m.result ? m.result[side] : null;
    return (
      <div onClick={() => code && setHi(h => h === code ? null : code)} style={{ display: "flex", alignItems: "center", gap: 10,
        padding: "9px 11px", cursor: code ? "pointer" : "default",
        background: isHi ? "var(--brand-soft)" : isWin ? "var(--paper-2)" : "transparent",
        borderRadius: "var(--r-sm)", opacity: code ? 1 : .72 }}>
        {code
          ? <CountryLogo code={code} size={26} />
          : <span style={{ width: 26, height: 28, flex: "none", borderRadius: 7, border: "1.5px dashed var(--line-2)" }} />}
        {code
          ? <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontWeight: isWin ? 800 : 600, color: isWin ? "var(--ink)" : "var(--ink-2)", fontSize: 14.5 }}>{window.WC.T[code].name}</div>
          : <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontSize: 13, color: "var(--ink-3)", fontWeight: 600 }}>Winner {slot && slot.win}{cand && cand[0] && cand[1] ? " \u00b7 " + cand[0] + " / " + cand[1] : ""}</div>}
        {isMine && <span title="your team" style={{ flex: "none", color: "var(--brand-ink)", fontSize: 13 }}>★</span>}
        {score != null && <span style={{ flex: "none", fontFamily: "var(--font-num)", fontWeight: 800, fontSize: 18, color: isWin ? "var(--ink)" : "var(--ink-3)",
          fontVariantNumeric: "tabular-nums" }}>{score}</span>}
      </div>
    );
  };

  return (
    <>
      <ScreenHeader title="Bracket" sub="Round of 32 → Final" waveIntensity={wave} brandTinted
        right={hi ? <button onClick={() => setHi(null)} style={{ border: "1.5px solid var(--brand)", background: "var(--brand-soft)",
          color: "var(--brand-ink)", borderRadius: 999, height: 34, padding: "0 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6 }}><CountryLogo code={hi} size={18} />{hi} path ✕</button>
          : <Pill color="ink">32 teams</Pill>} />
      <Scroll>
        {/* round selector */}
        <div style={{ display: "flex", gap: 6, background: "var(--paper-3)", borderRadius: 999, padding: 4 }}>
          {B.rounds.map(r => {
            const on = r.id === round;
            const dot = roundInvolves(r.id, hi);
            return (
              <button key={r.id} onClick={() => setRound(r.id)} style={{ flex: 1, height: 38, borderRadius: 999, border: "none",
                cursor: "pointer", fontWeight: 700, fontSize: 12.5, position: "relative",
                background: on ? "var(--surface)" : "transparent", color: on ? "var(--brand-ink)" : "var(--ink-2)",
                boxShadow: on ? "var(--shadow-sm)" : "none" }}>
                {r.short}
                {dot && !on && <span style={{ position: "absolute", top: 6, right: "50%", marginRight: -16, width: 6, height: 6,
                  borderRadius: 999, background: "var(--brand)" }} />}
              </button>
            );
          })}
        </div>

        {hi && <Banner tone="brand" icon="★">Following <b>{window.WC.T[hi].name}</b> — highlighted rounds show where they can still go.</Banner>}

        {rd.matches.map((m, i) => {
          const nx = nextOf(m.id);
          const involved = hi && (canReach(m.home, hi) || canReach(m.away, hi));
          return (
            <Card key={m.id} style={{ padding: 6, borderColor: involved ? "var(--brand)" : "var(--line)",
              opacity: hi && !involved ? .45 : 1, transition: "opacity .2s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 9px 6px" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", color: "var(--ink-3)", textTransform: "uppercase" }}>{rd.short} · Match {i + 1}</span>
                {m.winner
                  ? <Pill color="green">✓ Decided</Pill>
                  : <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>Upcoming</span>}
              </div>
              <SlotRow slot={m.home} m={m} side="h" />
              <div style={{ height: 1, background: "var(--line)", margin: "1px 11px" }} />
              <SlotRow slot={m.away} m={m} side="a" />
              {nx && (
                <button onClick={() => setRound(nx.round)} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%",
                  border: "none", background: "transparent", cursor: "pointer", padding: "8px 11px 5px", color: "var(--brand-ink)",
                  fontSize: 12, fontWeight: 700, textAlign: "left" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ flex: "none" }}><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Advances to {labelOf(nx.round)} · Match {nx.round === "final" ? 1 : (B.rounds.find(r => r.id === nx.round).matches.indexOf(nx.match) + 1)}</span>
                </button>
              )}
            </Card>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-3)", fontSize: 12.5, padding: "2px 6px 0" }}>
          <span style={{ color: "var(--brand-ink)", fontSize: 13 }}>★</span> Your drafted teams · tap any team to trace its path to the Final.
        </div>
      </Scroll>
    </>
  );
}

Object.assign(window, { ReorderList, Grip, DraftPrefsScreen, BracketScreen });
