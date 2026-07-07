// @ds-adherence-ignore
// ============================================================
// WC2026 — Admin pattern reference board (the reusable kit).
// ============================================================
const { useState } = React;

function Swatch({ name, varName, ink }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ height: 44, borderRadius: 10, background: `var(${varName})`, border: "1px solid var(--line)" }} />
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>{name}</div>
    </div>
  );
}

function KitGroup({ title, children, span }) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : "auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--ink-3)" }}>{title}</div>
      {children}
    </div>
  );
}

function PatternBoard() {
  const [n, setN] = useState(3);
  const [on, setOn] = useState(true);
  return (
    <div style={{ width: 1180, background: "var(--paper-2)", padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>

        <KitGroup title="Buttons">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Button kind="primary" size="sm" style={{ minHeight: 44 }}>Primary</Button>
            <Button kind="secondary" size="sm" style={{ minHeight: 44 }}>Secondary</Button>
            <Button kind="ghost" size="sm" style={{ minHeight: 44 }}>Ghost</Button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Button kind="danger" size="sm" style={{ minHeight: 44 }}>Danger</Button>
            <Button kind="gold" size="sm" style={{ minHeight: 44 }}>Payout</Button>
            <Button kind="primary" size="sm" disabled style={{ minHeight: 44 }}>Disabled</Button>
          </div>
        </KitGroup>

        <KitGroup title="Inputs">
          <Input placeholder="Text input" />
          <Select value="a"><option value="a">Select menu</option></Select>
        </KitGroup>

        <KitGroup title="Number stepper · Toggle">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <NumberStepper value={n} onChange={setN} />
            <Toggle on={on} onChange={setOn} labels={["On", "Off"]} />
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>46px hit targets; ±1 per tap, hard to mis-tap.</div>
        </KitGroup>

        <KitGroup title="Status & badges">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Status kind="active" /><Status kind="pending" /><Status kind="locked" />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill color="brand">Admin</Pill><Pill color="ink">Player</Pill><Pill color="gold">Winner</Pill><Pill color="green">Saved</Pill>
          </div>
        </KitGroup>

        <KitGroup title="Color tokens" span={2}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            <Swatch name="paper" varName="--paper" />
            <Swatch name="ink" varName="--ink" />
            <Swatch name="blue" varName="--blue" />
            <Swatch name="green" varName="--green" />
            <Swatch name="red" varName="--red" />
            <Swatch name="gold" varName="--gold" />
          </div>
        </KitGroup>

        <KitGroup title="Table row anatomy" span={3}>
          <Table columns={[{ label: "Item", w: "1fr" }, { label: "Meta", w: "200px" }, { label: "Status", w: "120px" }, { label: "", w: "160px", align: "right" }]}>
            <Row columns={[{ w: "1fr" }, { w: "200px" }, { w: "120px" }, { w: "160px", align: "right" }]} cells={[
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}><Avatar name="Row Item" color="var(--blue)" size={36} uploadable /><span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Row item + avatar</span></div>,
              <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>secondary meta</span>,
              <Status kind="active" />,
              <div style={{ display: "inline-flex", gap: 4, justifyContent: "flex-end" }}><RowAction tone="brand" icon={<EditIcon />}>Edit</RowAction><RowAction tone="danger" icon={<TrashIcon />}>Remove</RowAction></div>,
            ]} />
            <Row last columns={[{ w: "1fr" }, { w: "200px" }, { w: "120px" }, { w: "160px", align: "right" }]} cells={[
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}><Avatar name="Two" color="var(--green)" size={36} uploadable /><span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Second row</span></div>,
              <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>secondary meta</span>,
              <Status kind="pending" />,
              <div style={{ display: "inline-flex", gap: 4, justifyContent: "flex-end" }}><RowAction tone="brand" icon={<EditIcon />}>Edit</RowAction><RowAction tone="danger" icon={<TrashIcon />}>Remove</RowAction></div>,
            ]} />
          </Table>
        </KitGroup>

        <KitGroup title="Empty state" span={3}>
          <EmptyState title="No predictions yet" body="Once a player saves group-stage predictions they'll appear here for review."
            action={<Button kind="secondary" size="sm" style={{ minHeight: 44 }}>Enter on behalf of player</Button>} />
        </KitGroup>

      </div>
    </div>
  );
}

Object.assign(window, { PatternBoard });
