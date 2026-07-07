"use client";
// Ported from handoff/code/app/draft/draft-prefs-screen.tsx — DRAFT ORDER page.
// Drag-to-rank snake positions + team wishlist. Persists via existing save actions.
import * as React from "react";
import { ScreenHeader, Scroll, CountryLogo } from "@/components/wc-ui";

/* ── ReorderList — pointer/touch drag-to-rank ──────────────────── */
export function ReorderList({
  items,
  rowGap = 8,
  onChange,
  renderRow,
}: {
  items: string[];
  rowGap?: number;
  onChange?: (order: string[]) => void;
  renderRow: (
    key: string,
    rank: number,
    handlers: React.HTMLAttributes<HTMLElement> & { style: React.CSSProperties }
  ) => React.ReactNode;
}) {
  const [order, setOrder] = React.useState(items);
  React.useEffect(() => { setOrder(items); }, [items.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const st = React.useRef<{ key: string; startIdx: number; idx: number; startY: number; unit: number } | null>(null);
  const [drag, setDrag] = React.useState<{ key: string | null; dy: number }>({ key: null, dy: 0 });

  const begin = (e: React.PointerEvent, key: string) => {
    const rows = [...(wrapRef.current!.children as unknown as HTMLElement[])];
    const startIdx = order.indexOf(key);
    const rect = rows[startIdx].getBoundingClientRect();
    st.current = { key, startIdx, idx: startIdx, startY: e.clientY, unit: rect.height + rowGap };
    setDrag({ key, dy: 0 });
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
    e.preventDefault();
  };
  const move = (e: React.PointerEvent) => {
    if (!st.current) return;
    const dy = e.clientY - st.current.startY;
    let ni = st.current.startIdx + Math.round(dy / st.current.unit);
    ni = Math.max(0, Math.min(order.length - 1, ni));
    if (ni !== st.current.idx) {
      setOrder((o) => {
        const a = [...o];
        const cur = a.indexOf(st.current!.key);
        a.splice(cur, 1);
        a.splice(ni, 0, st.current!.key);
        return a;
      });
      st.current.idx = ni;
    }
    setDrag((d) => ({ ...d, dy }));
  };
  const end = () => {
    if (st.current) onChange?.(order);
    st.current = null;
    setDrag({ key: null, dy: 0 });
  };

  return (
    <div ref={wrapRef} className="flex flex-col relative" style={{ gap: rowGap }}>
      {order.map((key) => {
        const i = order.indexOf(key);
        const dragging = drag.key === key;
        const visualDy = dragging && st.current ? drag.dy - (st.current.idx - st.current.startIdx) * st.current.unit : 0;
        const handlers = {
          onPointerDown: (e: React.PointerEvent) => begin(e, key),
          onPointerMove: move,
          onPointerUp: end,
          onPointerCancel: end,
          style: { touchAction: "none" as const, cursor: dragging ? "grabbing" : "grab" },
        };
        return (
          <div
            key={key}
            className="relative rounded-md"
            style={{
              zIndex: dragging ? 5 : 1,
              transform: dragging ? `translateY(${visualDy}px) scale(1.015)` : "none",
              transition: dragging ? "none" : "transform .18s cubic-bezier(.2,.8,.2,1)",
              boxShadow: dragging ? "var(--shadow-lg)" : "none",
            }}
          >
            {renderRow(key, i, handlers)}
          </div>
        );
      })}
    </div>
  );
}

// 6-dot drag affordance — 30×44 hit area (SPEC §11.6)
export function Grip(props: React.HTMLAttributes<HTMLSpanElement> & { style?: React.CSSProperties }) {
  return (
    <span
      {...props}
      className="shrink-0 grid place-items-center text-ink-3 [-webkit-tap-highlight-color:transparent]"
      style={{ width: 30, height: 44, ...props.style }}
    >
      <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
        {[3, 9, 15].map((y) => [2.5, 9.5].map((x) => <circle key={x + "-" + y} cx={x} cy={y} r="1.5" />))}
      </svg>
    </span>
  );
}

export type WishlistTeam = { code: string; name: string; themeColor?: string; logoUrl?: string | null };

export function DraftPrefsScreen({
  playerCount = 10,
  teams,
  initialPositionOrder,
  onPositionsChange,
  onTeamsChange,
  onDone,
  saving = false,
  waveIntensity = 1,
}: {
  playerCount?: number;
  teams: WishlistTeam[];
  initialPositionOrder?: string[];
  onPositionsChange?: (order: string[]) => void;
  onTeamsChange?: (order: string[]) => void;
  onDone?: () => void;
  saving?: boolean;
  waveIntensity?: number;
}) {
  const N = playerCount;
  const positions = initialPositionOrder ?? Array.from({ length: N }, (_, i) => "p" + (i + 1));
  const picksFor = (p: number) => [p, 2 * N + 1 - p, 2 * N + p];
  const byCode = React.useMemo(() => Object.fromEntries(teams.map((t) => [t.code, t])), [teams]);

  return (
    <>
      <ScreenHeader
        title="Draft Order"
        sub="Positions & team wishlist"
        waveIntensity={waveIntensity}
        right={
          <button
            onClick={onDone}
            disabled={saving}
            className="h-9 px-[18px] rounded-pill bg-brand text-brand-on font-extrabold text-[13.5px] flex items-center cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving…" : "Done"}
          </button>
        }
      />
      <Scroll>
        <p className="mx-0.5 my-0 text-ink-2 text-[13.5px] leading-[1.5]">
          Record your snake-draft position preference and team wishlist. These are for your own planning — admins
          only access them if you&apos;re unavailable during the draft.
        </p>

        {/* Position preference */}
        <div className="mx-0.5 mt-2 -mb-0.5">
          <div className="font-display font-bold uppercase text-[17px] text-ink">Draft position preference</div>
          <div className="mt-0.5 text-ink-2 text-[12.5px] leading-[1.45]">
            Drag to rank positions, most to least preferred. Each row shows the overall picks that position gets.
          </div>
        </div>
        <ReorderList
          items={positions}
          rowGap={8}
          onChange={onPositionsChange}
          renderRow={(key, rank, h) => {
            const p = parseInt(key.slice(1), 10);
            const top = rank === 0;
            return (
              <div
                className={
                  "flex items-center bg-surface rounded-md shadow-sm overflow-hidden pr-3.5 border-[1.5px] " +
                  (top ? "border-brand" : "border-line")
                }
              >
                <Grip {...h} />
                <span className={"w-[30px] text-center shrink-0 font-num font-bold text-[18px] " + (top ? "text-brand-ink" : "text-ink-3")}>
                  {rank + 1}
                </span>
                <div className="flex-1 min-w-0 py-[11px] pl-2">
                  <div className="font-bold text-[15.5px] text-ink">Position {p}</div>
                  <div className="text-[12.5px] text-ink-3 mt-px">picks {picksFor(p).join(", ")}</div>
                </div>
              </div>
            );
          }}
        />

        {/* Team wishlist */}
        <div className="mx-0.5 mt-3.5 -mb-0.5">
          <div className="font-display font-bold uppercase text-[17px] text-ink">Team preference order</div>
          <div className="mt-0.5 text-ink-2 text-[12.5px] leading-[1.45]">
            Drag to rank teams, most to least wanted. Default is FIFA ranking. Hold briefly, then drag.
          </div>
        </div>
        <ReorderList
          items={teams.map((t) => t.code)}
          rowGap={7}
          onChange={onTeamsChange}
          renderRow={(code, rank, h) => {
            const team = byCode[code];
            return (
              <div className="flex items-center bg-surface border border-line rounded-md shadow-sm overflow-hidden pr-3.5">
                <Grip {...h} />
                <span className="w-[26px] text-center shrink-0 font-num font-bold text-[15px] text-ink-3">{rank + 1}</span>
                <span className="shrink-0 mx-1">
                  <CountryLogo code={code} themeColor={team?.themeColor} logoUrl={team?.logoUrl} size={26} />
                </span>
                <div className="flex-1 min-w-0 py-2.5 flex items-baseline gap-2">
                  <span className="font-num font-bold text-[12px] text-ink-3 shrink-0 w-8">{code}</span>
                  <span className="font-bold text-[15px] text-ink truncate">{team?.name}</span>
                </div>
              </div>
            );
          }}
        />

        <div className="text-ink-3 text-[12px] text-center px-2 pt-1 pb-0.5 leading-[1.5]">
          Saved automatically. Update any time before the draft locks.
        </div>
      </Scroll>
    </>
  );
}
