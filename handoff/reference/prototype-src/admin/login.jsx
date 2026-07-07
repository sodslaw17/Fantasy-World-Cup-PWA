// @ds-adherence-ignore
// ============================================================
// WC2026 — Login page. Bold "racetrack" key-art hero: concentric
// rounded-rectangle stripes in a vibrant spectrum (original shapes,
// no FIFA marks), with a clean white form sheet for legibility.
// ============================================================
const { useState } = React;

/* iPhone shell (status bar + island) */
function Phone({ children }) {
  return (
    <div style={{ width: 390, height: 844, borderRadius: 54, padding: 11, background: "#0B0C0F",
      boxShadow: "0 30px 70px rgba(20,21,26,.30), inset 0 0 0 2px #2A2C33", flex: "none" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 44, overflow: "hidden",
        background: "var(--paper)", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44, zIndex: 50, display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: "0 26px", pointerEvents: "none",
          color: "#fff", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 14, textShadow: "0 1px 3px rgba(0,0,0,.35)" }}>
          <span>9:41</span>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1" /><rect x="5" y="4" width="3" height="8" rx="1" /><rect x="10" y="1.5" width="3" height="10.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" opacity=".55" /></svg>
            <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="17" height="10" rx="3" /><rect x="3" y="3" width="12" height="6" rx="1.5" fill="currentColor" stroke="none" /><rect x="19.5" y="4" width="1.5" height="4" rx="1" fill="currentColor" /></svg>
          </span>
        </div>
        <div style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", width: 116, height: 32,
          background: "#0B0C0F", borderRadius: 20, zIndex: 60 }} />
        {children}
      </div>
    </div>
  );
}

/* Concentric rounded-rect "racetrack" stripes, radiating from (cx,cy). */
const KEYART_COLORS = ["#E4002B", "#7C3AED", "#A3E635", "#FF7A00", "#1D4ED8", "#14B8A6", "#FFC400", "#00A859", "#EC4899", "#22D3EE", "#6D28D9", "#F97316"];
function KeyArt({ width = 390, height = 844, cx = 195, cy = 250 }) {
  const rings = [];
  const maxR = 560, step = 30;
  let idx = 0;
  for (let s = maxR; s >= 0; s -= step, idx++) {
    rings.push({ s, color: KEYART_COLORS[idx % KEYART_COLORS.length] });
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
      <rect width={width} height={height} fill={KEYART_COLORS[0]} />
      {rings.map((r, i) => (
        <rect key={i} x={cx - r.s} y={cy - r.s} width={r.s * 2} height={r.s * 2}
          rx={r.s * 0.46} ry={r.s * 0.46} fill={r.color} />
      ))}
      {/* horizon mirror line, like the reference */}
      <rect x="0" y={cy - 1} width={width} height="2" fill="rgba(255,255,255,.22)" />
    </svg>
  );
}

/* White World Cup trophy silhouette — wide bowl (holds both title lines),
   tapered stem, tiered base. Original stylized outline, not FIFA artwork. */
function Trophy() {
  const W = 182, H = 274;
  return (
    <div style={{ position: "relative", width: W, filter: "drop-shadow(0 20px 42px rgba(0,0,0,.38))" }}>
      <svg width={W} height={H} viewBox="0 0 200 300" style={{ display: "block" }} aria-hidden="true">
        {/* bowl */}
        <path d="M14 56 C14 28 48 16 100 16 C152 16 186 28 186 56 C186 110 154 156 100 156 C46 156 14 110 14 56 Z" fill="#fff" />
        {/* stem */}
        <path d="M82 150 C80 182 74 206 66 224 L134 224 C126 206 120 182 118 150 Z" fill="#fff" />
        {/* base — upper tier */}
        <path d="M58 218 H142 C150 218 156 224 156 232 L156 240 C156 248 150 254 142 254 H58 C50 254 44 248 44 240 L44 232 C44 224 50 218 58 218 Z" fill="#fff" />
        {/* base — foot */}
        <path d="M40 250 H160 C166 250 170 254 170 262 L170 272 C170 280 164 286 156 286 H44 C36 286 30 280 30 272 L30 262 C30 254 34 250 40 250 Z" fill="#fff" />
      </svg>
      {/* both title lines, seated in the bowl */}
      <div style={{ position: "absolute", left: 0, right: 0, top: "4%", height: "48%", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
        fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", color: "#000", lineHeight: 1.02 }}>
        <span style={{ fontSize: 24, whiteSpace: "nowrap" }}>World Cup</span>
        <span style={{ fontSize: 24, whiteSpace: "nowrap" }}>2026</span>
        <span style={{ fontSize: 19, whiteSpace: "nowrap", marginTop: 4, color: "#1a1a1a" }}>Fantasy League</span>
      </div>
    </div>
  );
}

/* Multi-color accent bar that ties the form sheet to the hero */
function SpectrumBar() {
  const cols = ["#E4002B", "#FF7A00", "#FFC400", "#00A859", "#1D4ED8", "#7C3AED"];
  return (
    <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 16 }}>
      {cols.map((c, i) => <span key={i} style={{ width: 26, height: 6, borderRadius: 999, background: c }} />)}
    </div>
  );
}

function LoginScreen({ sent = false }) {
  const [email, setEmail] = useState(sent ? "alex@wc26pool.com" : "");
  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0B0C0F" }}>
      <KeyArt cx={195} cy={150} />

      {/* white trophy holding the title, centered on the color bullseye */}
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 2 }}>
        <Trophy />
      </div>

      {/* form sheet */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 3, background: "var(--surface)",
        borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: "22px 24px calc(env(safe-area-inset-bottom) + 22px)",
        boxShadow: "0 -18px 50px rgba(0,0,0,.22)" }}>
        <SpectrumBar />
        {sent ? <SentState email={email} /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 30, color: "var(--ink)", lineHeight: 1, letterSpacing: ".01em" }}>Kick off</div>
              <div style={{ marginTop: 7, fontSize: 13.5, color: "var(--ink-2)", fontWeight: 500 }}>Sign in to your World Cup pool — no password.</div>
            </div>
            <Field label="Email address" hint="Use the address your pool organizer added.">
              <Input big type="email" value={email} onChange={setEmail} placeholder="you@email.com"
                leftIcon={<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="4" width="16" height="12" rx="2.5" /><path d="M3 6l7 5 7-5" strokeLinecap="round" /></svg>} />
            </Field>
            <Button kind="primary" full style={{ minHeight: 54, fontSize: 17 }}>
              Send magic link
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--ink-3)" strokeWidth="1.8"><rect x="4" y="9" width="12" height="8" rx="2" /><path d="M7 9V6.5a3 3 0 016 0V9" /></svg>
              <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase" }}>Private pool · invite only</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SentState({ email }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: 999, margin: "0 auto", background: "var(--green-soft)",
        color: "var(--green-ink)", display: "grid", placeItems: "center" }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="5" width="18" height="14" rx="2.5" /></svg>
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 25, color: "var(--ink)", lineHeight: 1 }}>Check your email</div>
        <div style={{ marginTop: 9, fontSize: 14, color: "var(--ink-2)", fontWeight: 500, lineHeight: 1.45 }}>
          We sent a sign-in link to<br /><span style={{ color: "var(--ink)", fontWeight: 700 }}>{email}</span>
        </div>
      </div>
      <Button kind="ghost" full style={{ minHeight: 50 }}>Open mail app</Button>
      <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: "var(--brand-ink)" }}>
        Didn't get it? Resend link
      </button>
    </div>
  );
}

Object.assign(window, { Phone, LoginScreen });
