/* ============================================================
   WC2026 Fantasy — UI layer
   Contrast guardrail · Flag rendering · name+icon atoms ·
   buttons · cards · score stepper · wave header · tab bar · frame
   ============================================================ */

/* -------------------------------------------------------------
   WCAG AA CONTRAST GUARDRAIL (SPEC §11.5)
   Given any flag-derived color, derive AA-safe variants so text
   & controls are never washed out under a per-user theme.
------------------------------------------------------------- */
function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
function relLum([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [R, G, B] = [f(r), f(g), f(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrast(hexA, hexB) {
  const l1 = relLum(hexToRgb(hexA)), l2 = relLum(hexToRgb(hexB));
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
// darken (factor<1) or lighten (factor>1) toward black/white in rgb space
function scale(hex, factor) {
  const [r, g, b] = hexToRgb(hex);
  if (factor < 1) return rgbToHex(r * factor, g * factor, b * factor);
  const t = factor - 1;
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}
// Return a version of `hex` that hits `ratio` against `bg`, nudging darker
// (if bg is light) or lighter (if bg is dark).
function ensureContrast(hex, bg = "#FFFFFF", ratio = 4.5) {
  if (contrast(hex, bg) >= ratio) return hex;
  const bgLight = relLum(hexToRgb(bg)) > 0.4;
  let out = hex;
  for (let i = 0; i < 24; i++) {
    out = scale(out, bgLight ? 0.92 : 1.08);
    if (contrast(out, bg) >= ratio) break;
  }
  return out;
}
// Pick the legible text color (ink or white) to sit on top of `fill`.
function onColor(fill) {
  return contrast("#14151A", fill) >= contrast("#FFFFFF", fill) ? "#14151A" : "#FFFFFF";
}

/* Build the full per-user theme variable set from a flag's two colors,
   guaranteeing AA. Used to set CSS vars at runtime. */
function buildFlagTheme(primary, secondary) {
  const brand = primary;
  const brandInk = ensureContrast(primary, "#FFFFFF", 4.5);     // primary as text on white
  const brandOn = onColor(primary);                              // text on primary fill
  const brand2Ink = ensureContrast(secondary, "#FFFFFF", 4.5);
  // soft tint = primary mixed way up toward white
  const [r, g, b] = hexToRgb(primary);
  const soft = rgbToHex(r + (255 - r) * 0.9, g + (255 - g) * 0.9, b + (255 - b) * 0.9);
  return {
    "--brand": brand, "--brand-ink": brandInk, "--brand-on": brandOn,
    "--brand-soft": soft, "--brand-2": secondary, "--brand-2-ink": brand2Ink,
  };
}

/* -------------------------------------------------------------
   FLAG — simple geometric SVG per FIFA code (shapes only)
------------------------------------------------------------- */
function Flag({ code, className, style }) {
  const t = (window.WC.T[code] || {}).flag || { type: "solid", c: ["#ccc"] };
  let svg;
  const box = (vb, kids) => <svg viewBox={vb} preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>{kids}</svg>;
  switch (t.type) {
    case "vert":
      svg = box("0 0 3 2", t.c.map((c, i) => <rect key={i} x={i} y="0" width="1" height="2" fill={c} />)); break;
    case "horz":
      svg = box("0 0 3 3", t.c.map((c, i) => <rect key={i} x="0" y={i} width="3" height="1" fill={c} />)); break;
    case "solid":
      svg = box("0 0 3 2", <rect width="3" height="2" fill={t.c[0]} />); break;
    case "tri-l": // czech
      svg = box("0 0 6 4", <g><rect width="6" height="2" fill={t.c[0]} /><rect y="2" width="6" height="2" fill={t.c[1]} /><polygon points="0,0 3,2 0,4" fill={t.c[2]} /></g>); break;
    case "jpn":
      svg = box("0 0 3 2", <g><rect width="3" height="2" fill="#fff" /><circle cx="1.5" cy="1" r="0.6" fill="#BC002D" /></g>); break;
    case "kor":
      svg = box("0 0 3 2", <g><rect width="3" height="2" fill="#fff" /><path d="M1.5 0.6 A0.4 0.4 0 0 1 1.5 1.4 A0.4 0.4 0 0 0 1.5 0.6" fill="#CD2E3A" /><path d="M1.5 0.6 A0.4 0.4 0 0 0 1.5 1.4 A0.4 0.4 0 0 1 1.5 0.6" fill="#0A3D91" /></g>); break;
    case "bra":
      svg = box("0 0 14 10", <g><rect width="14" height="10" fill="#009C3B" /><polygon points="7,1.2 12.8,5 7,8.8 1.2,5" fill="#FFDF00" /><circle cx="7" cy="5" r="2.1" fill="#1C3FAA" /></g>); break;
    case "esp":
      svg = box("0 0 3 2", <g><rect width="3" height="2" fill="#AA151B" /><rect y="0.5" width="3" height="1" fill="#F1BF00" /></g>); break;
    case "eng":
      svg = box("0 0 5 3", <g><rect width="5" height="3" fill="#fff" /><rect x="2" width="1" height="3" fill="#CE1124" /><rect y="1" width="5" height="1" fill="#CE1124" /></g>); break;
    case "por":
      svg = box("0 0 6 4", <g><rect width="6" height="4" fill="#FF0000" /><rect width="2.4" height="4" fill="#006600" /><circle cx="2.4" cy="2" r="0.7" fill="#FFD700" /></g>); break;
    case "rsa":
      svg = box("0 0 12 8", <g><rect width="12" height="4" fill="#E03C31" /><rect y="4" width="12" height="4" fill="#001489" /><polygon points="0,0 5,4 0,8" fill="#FFB915" /><polygon points="0,1 3.5,4 0,7" fill="#007749" /></g>); break;
    default:
      svg = box("0 0 3 2", <rect width="3" height="2" fill="#ccc" />);
  }
  return <span className={className} style={{ display: "block", overflow: "hidden", ...style }}>{svg}</span>;
}

/* -------------------------------------------------------------
   NAME + ICON ATOMS (SPEC §11.4)
------------------------------------------------------------- */
function UserName({ id, name, color, size = 28, bold = true, you = false, dim = false }) {
  const p = id ? window.WC.byId[id] : null;
  const nm = name || (p && p.name) || "—";
  const col = color || (p && p.color) || "#565D6E";
  const init = (p && p.initials) || nm.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: bold ? 700 : 600, color: dim ? "var(--ink-2)" : "var(--ink)", minWidth: 0 }}>
      <span style={{ width: size, height: size, borderRadius: 999, flex: "none", background: col, color: "#fff",
        display: "grid", placeItems: "center", fontFamily: "var(--font-num)", fontWeight: 700,
        fontSize: size * 0.4, boxShadow: "var(--shadow-sm)", border: "1.5px solid rgba(255,255,255,.7)" }}>
        {/* avatar image would go here when uploaded; fallback = monogram */}
        {init}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {nm}{you && <span style={{ color: "var(--brand-ink)", fontWeight: 800 }}> · You</span>}
      </span>
    </span>
  );
}

function PlayerName({ name, color = "#14151A", size = 28, teamCode }) {
  const init = name.replace(/^[A-Z]\.\s*/, "").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 700, color: "var(--ink)", minWidth: 0 }}>
      <span style={{ width: size, height: size, borderRadius: 9, flex: "none", background: color, color: "#fff",
        display: "grid", placeItems: "center", fontFamily: "var(--font-num)", fontWeight: 700,
        fontSize: size * 0.38, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        {init}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
    </span>
  );
}

// Country soccer-crest logo. Admin-uploaded logo would render here; fallback
// is a tinted crest with the FIFA 3-letter code (SPEC §11.4 country component).
function CountryLogo({ code, size = 30 }) {
  const team = window.WC.T[code] || { code, theme: { p: "#8A90A0" } };
  const col = (team.theme && team.theme.p) || "#8A90A0";
  const onCrest = onColor(col);
  return (
    <span style={{ width: size, height: size, flex: "none", position: "relative", display: "grid", placeItems: "center" }}>
      {/* shield/crest silhouette */}
      <svg viewBox="0 0 40 44" style={{ width: "100%", height: "100%", position: "absolute", inset: 0, filter: "drop-shadow(0 1px 2px rgba(20,21,26,.12))" }}>
        <path d="M20 1 L37 7 V22 C37 33 29 40 20 43 C11 40 3 33 3 22 V7 Z" fill={col} stroke="#fff" strokeWidth="2" />
        <path d="M20 1 L37 7 V22 C37 33 29 40 20 43 C11 40 3 33 3 22 V7 Z" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="0.6" transform="scale(.84) translate(3.8 3.6)" />
      </svg>
      <span style={{ position: "relative", fontFamily: "var(--font-num)", fontWeight: 700, color: onCrest,
        fontSize: size * 0.30, letterSpacing: ".01em", paddingBottom: size * 0.06 }}>{code}</span>
    </span>
  );
}

function CountryName({ code, size = 26, bold = true, dim = false, abbrev = false, flag = false, reverse = false }) {
  const team = window.WC.T[code] || { name: code, code };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", flexDirection: reverse ? "row-reverse" : "row", gap: 9, fontWeight: bold ? 700 : 600, color: dim ? "var(--ink-2)" : "var(--ink)", minWidth: 0 }}>
      {flag
        ? <span style={{ width: size * 1.36, height: size, borderRadius: 5, flex: "none", overflow: "hidden", border: "1px solid var(--line-2)", boxShadow: "var(--shadow-sm)" }}><Flag code={code} /></span>
        : <CountryLogo code={code} size={size + 4} />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{abbrev ? team.code : team.name}</span>
    </span>
  );
}

// Knockout: admin custom icon stacked over flag (SPEC §7)
function CountryStacked({ code, size = 34, label = true, big = false }) {
  const team = window.WC.T[code] || { name: code, code };
  const crest = big ? 50 : size;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 11, fontWeight: 700, color: "var(--ink)" }}>
      <span style={{ position: "relative", flex: "none" }}>
        {/* Crest = placeholder for the admin-uploaded federation logo (SPEC §11.4). */}
        <CountryLogo code={code} size={crest} />
      </span>
      {label && <span style={{ fontFamily: big ? "var(--font-display)" : "inherit", fontSize: big ? 22 : 16, textTransform: big ? "uppercase" : "none", letterSpacing: big ? ".01em" : 0 }}>{team.name}</span>}
    </span>
  );
}

/* -------------------------------------------------------------
   BUTTONS / CARDS / PILLS
------------------------------------------------------------- */
function Btn({ kind = "primary", children, onClick, style, disabled, full }) {
  const base = {
    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 16, borderRadius: 999,
    border: "1.5px solid transparent", minHeight: 48, padding: "0 22px", cursor: disabled ? "default" : "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: full ? "100%" : "auto", opacity: disabled ? 0.55 : 1,
    transition: "transform .08s ease, box-shadow .15s ease", WebkitTapHighlightColor: "transparent",
  };
  const kinds = {
    primary:   { background: "var(--brand)", color: "var(--brand-on)", boxShadow: "var(--shadow-sm)" },
    secondary: { background: "var(--brand-soft)", color: "var(--brand-ink)" },
    ghost:     { background: "transparent", color: "var(--ink)", borderColor: "var(--line-2)" },
    gold:      { background: "linear-gradient(180deg,#D8B868,var(--gold))", color: "#3A2D07", boxShadow: "var(--shadow-gold)" },
    danger:    { background: "var(--red)", color: "#fff" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...kinds[kind], ...style }}
    onMouseDown={e => !disabled && (e.currentTarget.style.transform = "translateY(1px) scale(.99)")}
    onMouseUp={e => e.currentTarget.style.transform = ""} onMouseLeave={e => e.currentTarget.style.transform = ""}>{children}</button>;
}

function Card({ children, style, tone, onClick }) {
  const tones = {
    gold: { background: "var(--gold-soft)", borderColor: "var(--gold-line)" },
    brand: { background: "var(--brand-soft)", borderColor: "transparent" },
  };
  return <div onClick={onClick} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)",
    boxShadow: "var(--shadow-sm)", ...(tone ? tones[tone] : {}), ...style }}>{children}</div>;
}

function Pill({ children, color = "ink", style }) {
  const map = {
    ink: { background: "var(--paper-3)", color: "var(--ink-2)" },
    brand: { background: "var(--brand-soft)", color: "var(--brand-ink)" },
    gold: { background: "var(--gold-soft)", color: "var(--gold-ink)" },
    green: { background: "var(--green-soft)", color: "var(--green-ink)" },
    red: { background: "var(--red-soft)", color: "var(--red-ink)" },
  };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700,
    padding: "4px 11px", borderRadius: 999, letterSpacing: ".02em", ...map[color], ...style }}>{children}</span>;
}

function PtsBadge({ value }) {
  const c = value === 3 ? "var(--good)" : value === 2 ? "var(--gold-ink)" : "var(--ink-3)";
  return <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 15, color: c, fontVariantNumeric: "tabular-nums" }}>
    {value > 0 ? "+" + value : "+0"}</span>;
}

/* -------------------------------------------------------------
   SCORE STEPPER (SPEC §11.6 — thumb-friendly)
------------------------------------------------------------- */
function Stepper({ value, onChange, locked }) {
  const press = (dir) => { if (!locked) onChange(Math.max(0, Math.min(20, value + dir))); };
  const btn = (dir, sym) => (
    <button disabled={locked} onClick={() => press(dir)} aria-label={dir < 0 ? "decrease" : "increase"}
      style={{ width: 48, height: 48, borderRadius: "var(--r-md)", border: "1.5px solid var(--line-2)",
        background: "var(--surface)", fontSize: 26, fontWeight: 700, color: locked ? "var(--ink-3)" : "var(--ink)",
        cursor: locked ? "default" : "pointer", display: "grid", placeItems: "center", lineHeight: 1, userSelect: "none",
        transition: "transform .08s, background .12s", WebkitTapHighlightColor: "transparent" }}
      onMouseDown={e => { if (locked) return; e.currentTarget.style.transform = "scale(.9)"; e.currentTarget.style.background = dir < 0 ? "var(--red-soft)" : "var(--green-soft)"; e.currentTarget.style.borderColor = dir < 0 ? "var(--red)" : "var(--green)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}>
      {sym}</button>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {btn(-1, "−")}
      <span style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 32, minWidth: 50, height: 50,
        display: "grid", placeItems: "center", background: locked ? "var(--paper-3)" : "var(--ink)",
        color: locked ? "var(--ink)" : "#fff", borderRadius: "var(--r-md)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      {btn(1, "+")}
    </span>
  );
}

/* -------------------------------------------------------------
   WAVE HEADER — the three-wave motif. intensity: 0..1 (tweak)
------------------------------------------------------------- */
function WaveStrip({ intensity = 1, brandTinted = false, height = 26 }) {
  if (intensity <= 0.01) return <div style={{ height: 1, background: "var(--line)" }} />;
  const o = intensity;
  const c1 = brandTinted ? "var(--brand)" : "#0A3D91";
  const c2 = brandTinted ? "var(--brand-2)" : "#008A52";
  const c3 = brandTinted ? "var(--brand)" : "#E4002B";
  return (
    <svg viewBox="0 0 390 26" preserveAspectRatio="none" style={{ display: "block", width: "100%", height }}>
      <path d="M0 13 Q97 1 195 13 T390 13" fill="none" stroke={c1} strokeWidth="2.5" opacity={0.85 * o} />
      <path d="M0 17 Q97 5 195 17 T390 17" fill="none" stroke={c2} strokeWidth="2.5" opacity={0.7 * o} />
      <path d="M0 21 Q97 9 195 21 T390 21" fill="none" stroke={c3} strokeWidth="2.5" opacity={0.7 * o} />
    </svg>
  );
}

function ScreenHeader({ title, sub, right, waveIntensity = 1, brandTinted = false, big }) {
  return (
    <div style={{ background: "var(--surface)", paddingTop: "calc(var(--safe-top, env(safe-area-inset-top)) + 8px)" }}>
      <div style={{ padding: "10px 20px 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {sub && <div style={{ color: "var(--ink-2)", fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: ".005em", fontSize: big ? 34 : 28, lineHeight: 1, color: "var(--ink)" }}>{title}</h1>
        </div>
        {right && <div style={{ flex: "none" }}>{right}</div>}
      </div>
      <WaveStrip intensity={waveIntensity} brandTinted={brandTinted} />
    </div>
  );
}

/* -------------------------------------------------------------
   BOTTOM TAB BAR
------------------------------------------------------------- */
const TAB_ICONS = {
  standings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9a6 6 0 0012 0V3H6z"/><path d="M6 5H3v2a3 3 0 003 3M18 5h3v2a3 3 0 01-3 3M9 21h6M12 15v6" strokeLinecap="round"/></svg>,
  today: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round"/></svg>,
  predict: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 4l2.4 4.8L20 9.3l-3.7 3.5.9 5.2L12 15.6 6.8 18l.9-5.2L4 9.3l5.6-.5z" fill="currentColor" stroke="none"/></svg>,
  myteam: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" strokeLinecap="round"/></svg>,
  draft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round"/></svg>,
  payouts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8z"/><path d="M8.5 8a3.5 3.5 0 017 0" strokeLinecap="round"/><path d="M12 12v4M10 14h4" strokeLinecap="round"/></svg>,
  rules: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M8 20a3 3 0 01-3-3M9 8h6M9 12h6" strokeLinecap="round"/></svg>,
  bracket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h5v5H3M3 14h5v5H3M8 7.5h5v9h5M16 12h3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// Each tab carries a host color (USA red / Canada-ish… we cycle blue·green·red);
// the SELECTED tab's icon switches to gold with a soft gold lozenge behind it.
const TAB_HOST = { standings: "var(--blue)", today: "var(--green)", predict: "var(--red)", myteam: "var(--green)", draft: "var(--green)", bracket: "var(--red)", payouts: "var(--blue)", rules: "var(--green)" };

function TabBar({ tabs, active, onSelect }) {
  return (
    <div style={{ background: "var(--surface)", borderTop: "1px solid var(--line)",
      paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)", paddingTop: 8, display: "flex", justifyContent: "space-around",
      boxShadow: "0 -4px 18px rgba(20,21,26,.05)" }}>
      {tabs.map(t => {
        const on = t.id === active;
        const host = TAB_HOST[t.icon] || "var(--blue)";
        return (
          <button key={t.id} onClick={() => onSelect(t.id)} style={{ background: "none", border: "none", cursor: "pointer",
            display: "grid", justifyItems: "center", gap: 4, padding: "2px 4px", flex: 1, minWidth: 0, minHeight: 44,
            WebkitTapHighlightColor: "transparent" }}>
            <span style={{ width: 38, height: 28, borderRadius: 999, display: "grid", placeItems: "center",
              background: on ? "linear-gradient(180deg, var(--gold-soft), #F0E2BC)" : "transparent",
              boxShadow: on ? "inset 0 0 0 1px var(--gold-line)" : "none", transition: "background .15s" }}>
              <span style={{ width: 23, height: 23, display: "block", color: on ? "#9A7A24" : host, opacity: on ? 1 : 0.9 }}>{TAB_ICONS[t.icon]}</span>
            </span>
            <span style={{ fontSize: 10.5, fontWeight: on ? 800 : 600, color: on ? "var(--gold-ink)" : "var(--ink-3)", whiteSpace: "nowrap" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------
   PHONE FRAME (iPhone-ish, safe areas, dynamic island)
------------------------------------------------------------- */
function PhoneFrame({ children, dark }) {
  return (
    <div style={{ width: 392, height: 844, borderRadius: 56, padding: 12, background: "#0B0C0F",
      boxShadow: "0 40px 90px rgba(20,21,26,.34), 0 8px 24px rgba(20,21,26,.2), inset 0 0 0 2px #2A2C33", flex: "none" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 44, overflow: "hidden",
        background: "var(--paper)", "--safe-top": "44px", display: "flex", flexDirection: "column" }}>
        {/* status bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44, zIndex: 50, display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: "0 28px", pointerEvents: "none",
          color: "var(--ink)", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 14 }}>
          <span>9:41</span>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="1.5" width="3" height="10.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity=".35"/></svg>
            <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="17" height="10" rx="3"/><rect x="3" y="3" width="12" height="6" rx="1.5" fill="currentColor" stroke="none"/><rect x="19.5" y="4" width="1.5" height="4" rx="1" fill="currentColor"/></svg>
          </span>
        </div>
        {/* dynamic island */}
        <div style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", width: 118, height: 33,
          background: "#0B0C0F", borderRadius: 20, zIndex: 60 }} />
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   PODIUM — reusable top-3 (points, efficiency, anything)
   entries: [{ initials, name, sub, value, color, place }] (place 1..3)
   variant "user" = round avatar · "player" = squircle (footballer)
------------------------------------------------------------- */
function Podium({ entries, variant = "user", valueColor = "var(--gold-ink)" }) {
  const podCol = { 1: "#E9C45A", 2: "#C8CCD4", 3: "#D8A06A" };
  const barH = { 1: 74, 2: 52, 3: 38 };
  const order = [entries.find(e => e.place === 2), entries.find(e => e.place === 1), entries.find(e => e.place === 3)].filter(Boolean);
  const radius = variant === "player" ? 11 : 999;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
      {order.map((e) => {
        const top = e.place === 1;
        const av = top ? 56 : 46;
        return (
          <div key={e.place} style={{ display: "grid", justifyItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
            <div style={{ width: av, height: av, borderRadius: radius, background: e.color, color: "#fff",
              display: "grid", placeItems: "center", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: top ? 18 : 15,
              border: `3px solid ${podCol[e.place]}`, boxShadow: "var(--shadow-md)" }}>{e.initials}</div>
            <div style={{ fontWeight: 700, fontSize: 12.5, textAlign: "center", lineHeight: 1.12, maxWidth: "100%",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{e.name}</div>
            {e.owner && <div style={{ display: "inline-flex", alignItems: "center", gap: 4, maxWidth: "100%", marginTop: -1,
              fontSize: 10.5, fontWeight: 600, color: "var(--ink-2)", overflow: "hidden" }}>
              <span style={{ width: 15, height: 15, borderRadius: 999, flex: "none", background: e.owner.color, color: "#fff",
                display: "grid", placeItems: "center", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 7, border: "1.5px solid rgba(255,255,255,.7)" }}>{e.owner.initials}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.owner.name}</span>
            </div>}
            {e.sub && <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: -3 }}>{e.sub}</div>}
            <div style={{ fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 16, color: valueColor }}>{e.value}</div>
            <div style={{ width: "82%", height: barH[e.place], borderRadius: "9px 9px 0 0",
              background: `linear-gradient(180deg, ${podCol[e.place]}, ${podCol[e.place]}AA)`,
              display: "grid", placeItems: "start center", paddingTop: 5, fontFamily: "var(--font-num)",
              fontWeight: 700, color: "#fff", fontSize: 18 }}>{e.place}</div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------
   SCROLL — flex column body; children never shrink (so cards with
   overflow:hidden, e.g. podiums, can't be squeezed by siblings)
------------------------------------------------------------- */
if (typeof document !== "undefined" && !document.getElementById("wc-scroll-fix")) {
  const s = document.createElement("style"); s.id = "wc-scroll-fix";
  s.textContent = ".wc-scroll > * { flex-shrink: 0; }";
  document.head.appendChild(s);
}
function Scroll({ children, pad = 14 }) {
  return <div className="wc-scroll" style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch",
    padding: `12px ${pad}px calc(env(safe-area-inset-bottom) + 18px)`, display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>;
}
function Banner({ tone = "red", icon, children }) {
  const map = { red: ["var(--red-soft)", "var(--red)", "var(--red-ink)"], gold: ["var(--gold-soft)", "var(--gold-line)", "var(--gold-ink)"], brand: ["var(--brand-soft)", "transparent", "var(--brand-ink)"], green: ["var(--green-soft)", "transparent", "var(--green-ink)"] };
  const [bg, bd, fg] = map[tone];
  return <div style={{ background: bg, border: `1px solid ${bd}`, borderRadius: "var(--r-md)", padding: "12px 14px",
    display: "flex", gap: 10, alignItems: "center", color: fg, fontSize: 14, fontWeight: 600 }}><span style={{ fontSize: 16 }}>{icon}</span><span>{children}</span></div>;
}

Object.assign(window, {
  hexToRgb, contrast, ensureContrast, onColor, buildFlagTheme,
  Flag, UserName, PlayerName, CountryName, CountryLogo, CountryStacked,
  Btn, Card, Pill, PtsBadge, Stepper, WaveStrip, ScreenHeader, TabBar, PhoneFrame, Podium,
  Scroll, Banner,
});
