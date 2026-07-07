// @ds-adherence-ignore -- design-system source of truth (raw tokens by design)
// ============================================================
// WC2026 — shared TRIONDA atoms for Login + Admin surfaces.
// Pulled verbatim from the established prototype design system
// (tokens, Button, Card, Pill, inputs, wave geometry).
// Exported to window for cross-script use.
// ============================================================
const { useState } = React;

/* ---------- Brand wave geometry (the "tri-onda" three-wave motif) ---------- */
function WaveStrip({ height = 26, intensity = 1, style }) {
  const o = intensity;
  return (
    <svg viewBox="0 0 390 26" preserveAspectRatio="none" style={{ display: "block", width: "100%", height, ...style }}>
      <path d="M0 13 Q97 1 195 13 T390 13" fill="none" stroke="#0A3D91" strokeWidth="2.5" opacity={0.85 * o} />
      <path d="M0 17 Q97 5 195 17 T390 17" fill="none" stroke="#008A52" strokeWidth="2.5" opacity={0.7 * o} />
      <path d="M0 21 Q97 9 195 21 T390 21" fill="none" stroke="#E4002B" strokeWidth="2.5" opacity={0.7 * o} />
    </svg>
  );
}

// Big filled wave field for hero areas — soft stacked curves in the 3 accents.
function WaveField({ height = 200, style }) {
  return (
    <svg viewBox="0 0 390 200" preserveAspectRatio="none" style={{ display: "block", width: "100%", height, ...style }}>
      <path d="M0 96 Q120 40 240 92 T480 96 V200 H0 Z" fill="#0A3D91" opacity="0.06" />
      <path d="M0 120 Q130 64 250 116 T490 120 V200 H0 Z" fill="#008A52" opacity="0.07" />
      <path d="M0 146 Q120 92 240 142 T480 146 V200 H0 Z" fill="#E4002B" opacity="0.06" />
      <path d="M0 120 Q130 64 250 116 T490 120" fill="none" stroke="#0A3D91" strokeWidth="2" opacity="0.5" />
      <path d="M0 132 Q130 78 250 128 T490 132" fill="none" stroke="#008A52" strokeWidth="2" opacity="0.42" />
      <path d="M0 144 Q130 90 250 140 T490 144" fill="none" stroke="#E4002B" strokeWidth="2" opacity="0.42" />
    </svg>
  );
}

// Unity triangle — where the three accent colors meet (echoes the ball panels).
function TriMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <path d="M15 3 L26 22 H4 Z" fill="none" stroke="#14151A" strokeWidth="1.4" opacity="0.12" />
      <path d="M15 3 L15 15 L4 22 Z" fill="#0A3D91" />
      <path d="M15 3 L15 15 L26 22 Z" fill="#E4002B" />
      <path d="M4 22 L15 15 L26 22 Z" fill="#008A52" />
    </svg>
  );
}

/* ---------- App brand lockup ---------- */
// variant: "hero" (login), "bar" (admin top bar)
function Brand({ variant = "bar" }) {
  if (variant === "hero") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <BallMark size={64} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase",
            fontSize: 33, lineHeight: 1, letterSpacing: ".005em", color: "var(--ink)", whiteSpace: "nowrap" }}>WC26 Fantasy</div>
          <div style={{ marginTop: 9, fontSize: 12.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--ink-3)" }}>World Cup 2026 Pool</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <BallMark size={28} />
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase",
        fontSize: 19, letterSpacing: ".02em", color: "var(--ink)" }}>WC26 <span style={{ color: "var(--ink-3)" }}>Admin</span></span>
    </div>
  );
}

// Original "tri-onda" inspired ball mark (NOT the real TRIONDA artwork).
function BallMark({ size = 64 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 999, flex: "none", display: "grid", placeItems: "center",
      background: "var(--surface)", boxShadow: "var(--shadow-md), inset 0 0 0 1px var(--line)" }}>
      <svg width={size * 0.78} height={size * 0.78} viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="23" fill="#fff" stroke="var(--line-2)" strokeWidth="1" />
        <path d="M25 4 Q33 18 25 25 Q17 32 25 46" fill="none" stroke="#0A3D91" strokeWidth="2.4" />
        <path d="M5 21 Q20 27 25 25 Q33 22 46 30" fill="none" stroke="#008A52" strokeWidth="2.4" />
        <path d="M9 38 Q20 28 25 25 Q31 21 41 12" fill="none" stroke="#E4002B" strokeWidth="2.4" />
        <circle cx="25" cy="25" r="3" fill="#C8A24B" />
      </svg>
    </span>
  );
}

/* ---------- Button (matches prototype) ---------- */
function Button({ children, kind = "primary", full, disabled, size = "md", onClick, style, type }) {
  const base = {
    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: size === "sm" ? 14 : 16, borderRadius: 999,
    border: "1.5px solid transparent", minHeight: size === "sm" ? 38 : 48, padding: size === "sm" ? "0 16px" : "0 22px",
    cursor: disabled ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, width: full ? "100%" : "auto", opacity: disabled ? 0.55 : 1, whiteSpace: "nowrap",
  };
  const kinds = {
    primary:   { background: "var(--brand)", color: "var(--brand-on)", boxShadow: "var(--shadow-sm)" },
    secondary: { background: "var(--brand-soft)", color: "var(--brand-ink)" },
    ghost:     { background: "var(--surface)", color: "var(--ink)", borderColor: "var(--line-2)" },
    gold:      { background: "linear-gradient(180deg,#D8B868,var(--gold))", color: "#3A2D07", boxShadow: "var(--shadow-gold)" },
    danger:    { background: "var(--surface)", color: "var(--red-ink)", borderColor: "var(--red-soft)" },
  };
  return <button type={type} onClick={disabled ? undefined : onClick} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
}

/* ---------- Card ---------- */
function Card({ children, style, tone, pad = 16 }) {
  const tones = {
    gold: { background: "var(--gold-soft)", borderColor: "var(--gold-line)" },
    brand: { background: "var(--brand-soft)", borderColor: "transparent" },
    muted: { background: "var(--paper-2)", borderColor: "var(--line)" },
  };
  return <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)",
    boxShadow: "var(--shadow-sm)", padding: pad, ...(tone ? tones[tone] : {}), ...style }}>{children}</div>;
}

/* ---------- Pill ---------- */
function Pill({ children, color = "ink", style }) {
  const map = {
    ink: { background: "var(--paper-3)", color: "var(--ink-2)" },
    brand: { background: "var(--brand-soft)", color: "var(--brand-ink)" },
    gold: { background: "var(--gold-soft)", color: "var(--gold-ink)" },
    green: { background: "var(--green-soft)", color: "var(--green-ink)" },
    red: { background: "var(--red-soft)", color: "var(--red-ink)" },
    blue: { background: "var(--blue-soft)", color: "var(--blue-ink)" },
  };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700,
    padding: "3px 9px", borderRadius: 999, lineHeight: 1.3, ...map[color], ...style }}>{children}</span>;
}

/* ---------- Field (label + control) ---------- */
function Field({ label, hint, required, children, htmlFor, error }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {label && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>
        {label}{required && <span style={{ color: "var(--red-ink)", marginLeft: 3 }}>*</span>}
      </span>}
      {children}
      {hint && !error && <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500 }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: "var(--red-ink)", fontWeight: 600 }}>{error}</span>}
    </label>
  );
}

/* ---------- Text input (52px tap target) ---------- */
function Input({ value, onChange, placeholder, type = "text", id, leftIcon, big, invalid, style, mono }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {leftIcon && <span style={{ position: "absolute", left: 14, width: 20, height: 20, color: "var(--ink-3)", display: "grid", placeItems: "center", pointerEvents: "none" }}>{leftIcon}</span>}
      <input id={id} type={type} value={value} placeholder={placeholder} readOnly={!onChange}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: "100%", minHeight: big ? 54 : 48, padding: leftIcon ? "0 14px 0 42px" : "0 14px",
          borderRadius: "var(--r-md)", border: `1.5px solid ${invalid ? "var(--red)" : focus ? "var(--brand)" : "var(--line-2)"}`,
          background: "var(--surface)", color: "var(--ink)", fontFamily: mono ? "var(--font-num)" : "var(--font-body)",
          fontSize: big ? 17 : 15.5, fontWeight: 600, outline: "none",
          boxShadow: focus ? "0 0 0 3px var(--brand-soft)" : "none", transition: "border-color .12s, box-shadow .12s", ...style,
        }} />
    </div>
  );
}

/* ---------- Select ---------- */
function Select({ value, children, id, onChange, style }) {
  return (
    <div style={{ position: "relative", display: "flex" }}>
      <select id={id} defaultValue={value} onChange={onChange} style={{
        appearance: "none", width: "100%", minHeight: 48, padding: "0 38px 0 14px", borderRadius: "var(--r-md)",
        border: "1.5px solid var(--line-2)", background: "var(--surface)", color: "var(--ink)",
        fontFamily: "var(--font-body)", fontSize: 15.5, fontWeight: 600, outline: "none", cursor: "pointer", ...style }}>
        {children}
      </select>
      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-3)" }}>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1.5 6 6.5 11 1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </div>
  );
}

/* ---------- Number stepper (admin score/stat entry — thumb friendly) ---------- */
function NumberStepper({ value, onChange, min = 0, max = 99, width = 132 }) {
  const set = (v) => onChange && onChange(Math.max(min, Math.min(max, v)));
  const btn = (label, dir) => (
    <button aria-label={dir < 0 ? "decrease" : "increase"} onClick={() => set(value + dir)}
      style={{ width: 46, height: 46, flex: "none", border: "none", borderRight: dir < 0 ? "1px solid var(--line)" : "none",
        borderLeft: dir > 0 ? "1px solid var(--line)" : "none", background: "var(--paper-2)", color: "var(--ink)",
        fontSize: 24, fontWeight: 700, lineHeight: 1, cursor: "pointer", display: "grid", placeItems: "center", userSelect: "none" }}>{label}</button>
  );
  return (
    <div style={{ display: "inline-flex", alignItems: "center", width, height: 48, borderRadius: "var(--r-md)",
      border: "1.5px solid var(--line-2)", overflow: "hidden", background: "var(--surface)" }}>
      {btn("−", -1)}
      <span style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 20,
        color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      {btn("+", +1)}
    </div>
  );
}

/* ---------- Toggle ---------- */
function Toggle({ on, onChange, labels }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange && onChange(!on)}
      style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <span style={{ position: "relative", width: 46, height: 28, borderRadius: 999, flex: "none",
        background: on ? "var(--green)" : "var(--line-2)", transition: "background .15s" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 999,
          background: "#fff", boxShadow: "var(--shadow-sm)", transition: "left .15s" }} />
      </span>
      {labels && <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-2)" }}>{on ? labels[0] : labels[1]}</span>}
    </button>
  );
}

/* ---------- Avatar (floating-head fallback = monogram; upload affordance) ---------- */
function Avatar({ name, color = "var(--blue)", size = 40, uploadable }) {
  const init = (name || "?").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span style={{ position: "relative", width: size, height: size, borderRadius: 999, flex: "none", background: color,
      color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-num)", fontWeight: 700,
      fontSize: size * 0.38, border: "1.5px solid rgba(255,255,255,.7)", boxShadow: "var(--shadow-sm)" }}>
      {init}
      {uploadable && <span style={{ position: "absolute", right: -2, bottom: -2, width: 16, height: 16, borderRadius: 999,
        background: "var(--surface)", border: "1px solid var(--line-2)", display: "grid", placeItems: "center", color: "var(--ink-2)" }}>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2v8M2 6h8" strokeLinecap="round" /></svg>
      </span>}
    </span>
  );
}

/* ---------- Section heading inside cards/pages ---------- */
function SectionTitle({ children, sub, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".01em", fontSize: 21, color: "var(--ink)", lineHeight: 1 }}>{children}</div>
        {sub && <div style={{ marginTop: 5, fontSize: 13, color: "var(--ink-2)", fontWeight: 500, maxWidth: 540 }}>{sub}</div>}
      </div>
      {right && <div style={{ flex: "none" }}>{right}</div>}
    </div>
  );
}

Object.assign(window, {
  WaveStrip, WaveField, TriMark, Brand, BallMark, Button, Card, Pill,
  Field, Input, Select, NumberStepper, Toggle, Avatar, SectionTitle,
});
