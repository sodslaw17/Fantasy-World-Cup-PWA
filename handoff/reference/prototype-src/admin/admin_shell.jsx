// @ds-adherence-ignore
// ============================================================
// WC2026 — Admin pattern set (white TRIONDA base).
// Reusable shell, navigation, table, form rows, save bar, empty state.
// Internal/utilitarian: clarity, consistency, 44px+ tap targets.
// ============================================================

const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "draft", label: "Draft" },
  { id: "results", label: "Match & Stats" },
  { id: "sidepots", label: "Side Pots" },
  { id: "assets", label: "Assets" },
  { id: "settings", label: "Settings" },
];

/* ---------- Admin shell: top bar + brand-tinted wave + nav + content ---------- */
function AdminShell({ active = "results", title, sub, actions, children, width = 1180 }) {
  return (
    <div style={{ width, background: "var(--paper-2)", display: "flex", flexDirection: "column", minHeight: 760 }}>
      {/* top bar */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <Brand variant="bar" />
            <span style={{ width: 1, height: 26, background: "var(--line)" }} />
            <nav style={{ display: "flex", gap: 2 }}>
              {ADMIN_NAV.map(n => {
                const on = n.id === active;
                return (
                  <span key={n.id} style={{ position: "relative", padding: "8px 12px", borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap",
                    fontSize: 13.5, fontWeight: on ? 800 : 600, color: on ? "var(--brand-ink)" : "var(--ink-2)",
                    background: on ? "var(--brand-soft)" : "transparent" }}>{n.label}</span>
                );
              })}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--ink-2)", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H6a2 2 0 00-2 2v8a2 2 0 002 2h5M9 10h8M14 7l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              View app
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", borderRadius: 999, background: "var(--paper-2)", border: "1px solid var(--line)" }}>
              <Avatar name="Sam Park" color="var(--blue)" size={28} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>Sam · Admin</span>
            </span>
          </div>
        </div>
        <WaveStrip height={5} intensity={1} />
      </div>

      {/* page header */}
      <div style={{ padding: "22px 26px 18px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".01em", fontSize: 30, lineHeight: 1, color: "var(--ink)" }}>{title}</h1>
          {sub && <div style={{ marginTop: 8, fontSize: 13.5, color: "var(--ink-2)", fontWeight: 500, maxWidth: 660, lineHeight: 1.4 }}>{sub}</div>}
        </div>
        {actions && <div style={{ display: "flex", gap: 10, flex: "none" }}>{actions}</div>}
      </div>

      {/* content */}
      <div style={{ padding: "4px 26px 32px", flex: 1 }}>{children}</div>
    </div>
  );
}

/* ---------- Table / list primitives ---------- */
function Table({ columns, children, minWidth }) {
  return (
    <Card pad={0} style={{ overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: columns.map(c => c.w).join(" "), alignItems: "center",
        gap: 14, padding: "12px 18px", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", minWidth }}>
        {columns.map((c, i) => (
          <span key={i} style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase",
            color: "var(--ink-3)", textAlign: c.align || "left" }}>{c.label}</span>
        ))}
      </div>
      <div>{children}</div>
    </Card>
  );
}

function Row({ columns, cells, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: columns.map(c => c.w).join(" "), alignItems: "center",
      gap: 14, padding: "12px 18px", borderBottom: last ? "none" : "1px solid var(--line)" }}>
      {cells.map((cell, i) => (
        <div key={i} style={{ textAlign: columns[i].align || "left", minWidth: 0 }}>{cell}</div>
      ))}
    </div>
  );
}

// inline row action (text-button style) — meets tap target via padding
function RowAction({ children, tone = "ink", icon }) {
  const c = tone === "danger" ? "var(--red-ink)" : tone === "brand" ? "var(--brand-ink)" : "var(--ink-2)";
  return (
    <button style={{ display: "inline-flex", alignItems: "center", gap: 5, minHeight: 36, padding: "0 10px", borderRadius: 8,
      background: "transparent", border: "1px solid transparent", color: c, fontSize: 13, fontWeight: 700, cursor: "pointer",
      fontFamily: "var(--font-body)" }}>{icon}{children}</button>
  );
}

/* ---------- Status dot + label ---------- */
function Status({ kind }) {
  const map = {
    active: ["var(--green)", "Active", "var(--green-ink)"],
    pending: ["var(--gold)", "Invited", "var(--gold-ink)"],
    locked: ["var(--ink-3)", "Locked", "var(--ink-2)"],
  };
  const [dot, label, color] = map[kind] || map.active;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: dot, flex: "none" }} />{label}
    </span>
  );
}

/* ---------- Empty state ---------- */
function EmptyState({ title, body, action }) {
  return (
    <Card pad={0}>
      <div style={{ padding: "52px 26px 56px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span style={{ width: 64, height: 64, borderRadius: 18, background: "var(--paper-2)", border: "1px solid var(--line)",
          display: "grid", placeItems: "center", color: "var(--ink-3)", marginBottom: 16 }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18M8 15h5" strokeLinecap="round" /></svg>
        </span>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 20, color: "var(--ink)" }}>{title}</div>
        <div style={{ marginTop: 7, fontSize: 13.5, color: "var(--ink-2)", fontWeight: 500, maxWidth: 360, lineHeight: 1.45 }}>{body}</div>
        {action && <div style={{ marginTop: 18 }}>{action}</div>}
      </div>
    </Card>
  );
}

/* ---------- Sticky save bar ---------- */
function SaveBar({ savedLabel = "All changes saved", dirty }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 18px",
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-md)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: dirty ? "var(--gold-ink)" : "var(--green-ink)" }}>
        {dirty
          ? <><span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--gold)" }} />Unsaved changes</>
          : <><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /></svg>{savedLabel}</>}
      </span>
      <div style={{ display: "flex", gap: 10 }}>
        <Button kind="ghost" size="sm" style={{ minHeight: 44 }}>Discard</Button>
        <Button kind="primary" size="sm" style={{ minHeight: 44 }}>Save changes</Button>
      </div>
    </div>
  );
}

/* ---------- Form section block ---------- */
function FormBlock({ title, desc, children }) {
  return (
    <Card pad={0}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 0 }}>
        <div style={{ padding: "20px 22px", borderRight: "1px solid var(--line)", background: "var(--paper-2)" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{title}</div>
          {desc && <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500, lineHeight: 1.45 }}>{desc}</div>}
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
      </div>
    </Card>
  );
}

Object.assign(window, { ADMIN_NAV, AdminShell, Table, Row, RowAction, Status, EmptyState, SaveBar, FormBlock });
