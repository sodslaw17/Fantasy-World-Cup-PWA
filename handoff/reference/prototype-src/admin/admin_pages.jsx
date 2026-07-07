// @ds-adherence-ignore
// ============================================================
// WC2026 — Admin example pages + pattern reference board.
// ============================================================
const { useState } = React;

/* ============== EXAMPLE 1 — FORM PAGE: Match & Stats entry ============== */
function AdminFormPage() {
  const [home, setHome] = useState(2);
  const [away, setAway] = useState(2);
  const [shootout, setShootout] = useState(true);
  return (
    <AdminShell active="results" title="Match & Stats Entry"
      sub="Enter the open-play result, shootout outcome, and per-team stats. The scoring engine recomputes leaderboards automatically when you save."
      actions={<Button kind="ghost" size="sm" style={{ minHeight: 44 }}>Match history</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 980 }}>

        {/* match picker */}
        <Card pad={16}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, alignItems: "end" }}>
            <Field label="Match" hint="Round of 32 · Jun 28">
              <Select value="kor-cze">
                <option value="kor-cze">South Korea vs Czechia — Jun 28, 18:00</option>
                <option>Mexico vs South Africa — Jun 28, 21:00</option>
                <option>Brazil vs Morocco — Jun 29, 18:00</option>
              </Select>
            </Field>
            <Field label="Stage">
              <Select value="r32"><option value="r32">Round of 32</option><option>Round of 16</option><option>Quarter-final</option></Select>
            </Field>
          </div>
        </Card>

        {/* result */}
        <FormBlock title="Final result" desc="Goals scored in regulation + extra time. Exclude shootout penalty goals — record those below.">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26, padding: "4px 0" }}>
            <ScoreSide code="KOR" name="South Korea" value={home} onChange={setHome} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--ink-3)", fontWeight: 700 }}>–</span>
            <ScoreSide code="CZE" name="Czechia" value={away} onChange={setAway} />
          </div>
          <div style={{ height: 1, background: "var(--line)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Decided by penalty shootout?</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>Drew through extra time, then went to penalties.</div>
            </div>
            <Toggle on={shootout} onChange={setShootout} labels={["Yes", "No"]} />
          </div>
          {shootout && (
            <Field label="Shootout winner">
              <Select value="kor"><option value="kor">South Korea</option><option>Czechia</option></Select>
            </Field>
          )}
        </FormBlock>

        {/* penalty events */}
        <FormBlock title="Shootout events" desc="Per-player adjustments attributed to the team's drafter. Off-target −1 · failed Panenka −1 · scored Panenka +1.">
          <Table columns={[{ label: "Player", w: "1fr" }, { label: "Team", w: "160px" }, { label: "Event", w: "200px" }, { label: "", w: "44px", align: "right" }]}>
            <Row last columns={[{ w: "1fr" }, { w: "160px" }, { w: "200px" }, { w: "44px", align: "right" }]} cells={[
              <Input placeholder="Player name" value="J. Novák" style={{ minHeight: 44 }} />,
              <Select value="cze" style={{ minHeight: 44 }}><option value="cze">Czechia</option><option>South Korea</option></Select>,
              <Select value="off" style={{ minHeight: 44 }}><option value="off">Off-target (−1)</option><option>Failed Panenka (−1)</option><option>Scored Panenka (+1)</option></Select>,
              <RowAction tone="danger" icon={<TrashIcon />} />,
            ]} />
          </Table>
          <div><Button kind="secondary" size="sm" style={{ minHeight: 44 }}>+ Add shootout event</Button></div>
        </FormBlock>

        {/* discipline (2nd side pot) */}
        <FormBlock title="Discipline · 2nd Side Pot" desc="Cards per team this match. 1st yellow = 1 · 2nd yellow = 2 · straight red = 4.">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <CardRow code="KOR" name="South Korea" />
            <div style={{ height: 1, background: "var(--line)" }} />
            <CardRow code="CZE" name="Czechia" />
          </div>
        </FormBlock>

        <SaveBar dirty />
      </div>
    </AdminShell>
  );
}

function ScoreSide({ code, name, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 200 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <FlagChip code={code} />
        <span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>{name}</span>
      </div>
      <NumberStepper value={value} onChange={onChange} max={30} width={150} />
    </div>
  );
}

function CardRow({ code, name }) {
  const [y, setY] = useState(name === "Czechia" ? 2 : 1);
  const [y2, setY2] = useState(0);
  const [r, setR] = useState(0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 18, alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <FlagChip code={code} /><span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{name}</span>
      </div>
      <CardField swatch="#F4C430" label="Yellow" value={y} onChange={setY} />
      <CardField swatch="#E8A100" label="2nd yellow" value={y2} onChange={setY2} />
      <CardField swatch="var(--red)" label="Red" value={r} onChange={setR} />
    </div>
  );
}

function CardField({ swatch, label, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--ink-2)" }}>
        <span style={{ width: 9, height: 12, borderRadius: 2, background: swatch, display: "inline-block" }} />{label}
      </span>
      <NumberStepper value={value} onChange={onChange} max={11} width={120} />
    </div>
  );
}

function FlagChip({ code }) {
  return <span style={{ width: 30, height: 22, borderRadius: 5, flex: "none", background: "var(--paper-3)", border: "1px solid var(--line-2)",
    display: "grid", placeItems: "center", fontFamily: "var(--font-num)", fontWeight: 700, fontSize: 10, color: "var(--ink-2)" }}>{code}</span>;
}

function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h12M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6M6 6l.7 9a1.5 1.5 0 001.5 1.4h3.6A1.5 1.5 0 0013.3 15L14 6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function EditIcon() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 4l3 3M4 16l1-3.5L13.5 4a1.5 1.5 0 012 0 1.5 1.5 0 010 2L7 14.5 4 16z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/* ============== EXAMPLE 2 — LIST PAGE: Users ============== */
const USERS = [
  { name: "Alex Rivera", email: "alex@wc26pool.com", role: "Admin", status: "active", color: "var(--blue)" },
  { name: "Jordan Blake", email: "jordan.blake@gmail.com", role: "Player", status: "active", color: "var(--green)" },
  { name: "Maya Chen", email: "maya.chen@gmail.com", role: "Player", status: "active", color: "var(--red)" },
  { name: "Devin Okafor", email: "devin.okafor@gmail.com", role: "Player", status: "active", color: "#8A6D1E" },
  { name: "Priya Nair", email: "priya.n@umich.edu", role: "Player", status: "pending", color: "var(--blue)" },
  { name: "Sam Park", email: "sam@wc26pool.com", role: "Admin", status: "active", color: "var(--green)" },
  { name: "Leo Marsh", email: "leomarsh@gmail.com", role: "Player", status: "pending", color: "var(--red)" },
];
const UCOLS = [
  { label: "Player", w: "1.6fr" },
  { label: "Email", w: "1.6fr" },
  { label: "Role", w: "120px" },
  { label: "Status", w: "120px" },
  { label: "", w: "180px", align: "right" },
];

function AdminListPage() {
  return (
    <AdminShell active="users" title="Users"
      sub="These email addresses define who can sign in. Add a player's email and display name; they receive a magic link on first visit."
      actions={<Button kind="primary" size="sm" style={{ minHeight: 44 }}>+ Add player</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 980 }}>

        {/* inline add */}
        <Card pad={16} tone="muted">
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr auto", gap: 12, alignItems: "end" }}>
            <Field label="Email"><Input placeholder="player@email.com" leftIcon={<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="4" width="16" height="12" rx="2.5" /><path d="M3 6l7 5 7-5" strokeLinecap="round" /></svg>} /></Field>
            <Field label="Display name"><Input placeholder="e.g. Jordan Blake" /></Field>
            <Button kind="primary" style={{ minHeight: 48 }}>Add player</Button>
          </div>
        </Card>

        {/* count + filter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>7 players · 2 admins · <span style={{ color: "var(--gold-ink)" }}>2 invited</span></span>
          <div style={{ width: 240 }}><Input placeholder="Search players…" style={{ minHeight: 40 }} leftIcon={<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" strokeLinecap="round" /></svg>} /></div>
        </div>

        {/* table */}
        <Table columns={UCOLS}>
          {USERS.map((u, i) => (
            <Row key={u.email} last={i === USERS.length - 1} columns={UCOLS} cells={[
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <Avatar name={u.name} color={u.color} size={38} uploadable />
                <span style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)" }}>{u.name}</span>
              </div>,
              <span style={{ fontSize: 13.5, color: "var(--ink-2)", fontWeight: 500 }}>{u.email}</span>,
              <Pill color={u.role === "Admin" ? "brand" : "ink"}>{u.role}</Pill>,
              <Status kind={u.status} />,
              <div style={{ display: "inline-flex", gap: 4, justifyContent: "flex-end" }}>
                <RowAction tone="brand" icon={<EditIcon />}>Edit</RowAction>
                <RowAction tone="danger" icon={<TrashIcon />}>Remove</RowAction>
              </div>,
            ]} />
          ))}
        </Table>
      </div>
    </AdminShell>
  );
}

Object.assign(window, { AdminFormPage, AdminListPage, EditIcon, TrashIcon, USERS, UCOLS });
