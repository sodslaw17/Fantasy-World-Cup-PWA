# Claude Code — Phase 2: the 5 missing/mismatched pieces (WC2026 Fantasy)

You are working in my existing **Next.js (App Router) + Tailwind v4 + TypeScript** codebase
for the Fantasy World Cup 2026 pool app. The TRIONDA design system is finished and
authoritative, and you already applied it in an earlier pass (see `handoff/CLAUDE_CODE_PROMPT.md`).
This is a **follow-up**: five pieces are either missing from the build or came out "a little
off." For each, the **exact rendered code** is provided in `handoff/code/` — port it 1:1. Do
not redesign, do not interpret a description.

## What's in this package (match these EXACTLY)
| # | Piece | Provided file | Maps to my route/tab |
|---|-------|---------------|----------------------|
| 1 | **My Team** tab (knockout) — currently absent | `handoff/code/app/my-team/my-team-screen.tsx` | knockout `myteam` tab |
| 2 | **Per-user drafted-country theming** (§11.3) — not implemented | `handoff/code/app/brand-provider.tsx` | app-root wrapper / `app/(app)/layout.tsx` |
| 3 | **Draft** (pre-draft) — missing | `handoff/code/app/draft/standby-screen.tsx` + `draft-prefs-screen.tsx` | pre-draft `draft` tab (+ Draft Order page) |
| 4 | **Bracket** tab (knockout) | `handoff/code/app/bracket/bracket-screen.tsx` | knockout `bracket` tab |
| 5 | **Podium leaderboards** — build doesn't use the podium | `handoff/code/app/standings/standings-screen.tsx` | `standings` tab (all phases) |

All five already depend on the shared library you set up: `components/wc-ui.tsx`
(`ScreenHeader`, `Scroll`, `Card`, `Pill`, `Banner`, `Podium`, `CountryLogo`, `CountryStacked`,
`PlayerName`, `UserName`, `CountryName`), `lib/theme.ts` (`computeBrand`, `GROUP_ACCENTS`),
and `app/globals.css` tokens. Import the real ones — do not fork copies.

## Ground rules (do NOT violate)
1. **Presentation + provided component logic only.** The interaction logic inside the
   provided files (bracket path-tracing, drag-to-rank reorder, countdown) is part of the
   design — port it verbatim. But do **NOT** touch *your* server actions, route handlers,
   data fetching, mutations, validation, scoring, or business rules. Wire these components to
   the data you already load.
2. **Read my existing files first.** Before adding a screen, open the existing route/tab that
   should render it and the components it already uses. Refactor that page to render the
   provided component; **do not scaffold new routes or invent pages.** If a tab/route doesn't
   exist yet (e.g. `myteam`, `bracket`), add it to the existing tab config the same way the
   sibling tabs are registered — nothing more.
3. **Wire to real data; stub only where it genuinely doesn't exist.** Each provided component
   takes typed props (drafts, standings rows, bracket tree, etc.) and is pure markup. Map my
   real queries onto those props. Where a data source truly doesn't exist yet, pass a clearly
   commented `// TODO(stub):` placeholder of the right shape — never silently fake it, and
   never invent new fields/sections/copy beyond what the component renders.
4. **Reuse tokens — never inline a hex.** Everything resolves through the token utilities
   already in `globals.css`. The only allowed raw colors are data-driven values arriving as
   props (a team's `theme_*_hex`, a user's monogram color), applied inline — exactly as the
   provided files already do.
5. **Accessibility is hard (SPEC §11.5/§11.6).** Every control ≥ **44×44px**; the drag grips
   are 30×44, steppers 48. All text/icons meet **WCAG AA** in light **and** dark, under any
   per-user flag theme. Per-user brand colors must go through `computeBrand` (it runs the AA
   guardrail) — never hand-pick a brand text color.
6. **Gold is reserved** for winner/payout/leaderboard moments only (the gold podium tone in
   standings is sanctioned; do not introduce gold elsewhere).
7. **Mobile-first**, iPhone-optimized (~390pt). Drop any prototype `PhoneFrame` chrome.

## Piece-by-piece

### 1 · My Team (knockout `myteam` tab)
Port `my-team-screen.tsx`. Props: `userName`, `teams` (the viewer's drafted teams **ordered by
`pick_number`** — `teams[0]` is the first pick), `efficiency` (their 1st-side-pot footballer).
The first-pick card calls out the team that drives the per-user theme (piece 2). Wire `teams`
to the viewer's draft + that team's knockout points/GD; wire `efficiency` to your side-pot data.

### 2 · Per-user drafted-country theming (§11.3) — the important one
Port `brand-provider.tsx` and wrap the user-facing app tree with it (in `app/(app)/layout.tsx`
or wherever your app shell lives, **so it also wraps the TabBar and all five tabs**). Exact
logic, already implemented in `resolveBrandVars(...)`:
- **group / pre-draft / standby** → shared TRIONDA palette via `computeBrand(...GROUP_ACCENTS[accent], base)`.
- **knockout, once the user's draft is recorded** → take the pick with the **lowest
  `pick_number`** for that user → `computeBrand(team.theme_primary_hex, team.theme_secondary_hex, base)`.
- `computeBrand` returns the full AA-safe `--brand*` set; apply it as an **inline style on the
  wrapper**. Because `globals.css` is `@theme inline`, every `bg-brand` / `text-brand-ink` /
  `brandTinted` downstream re-skins automatically. **Never** extract color from a flag image at
  runtime, and **never** read a raw flag hex in a component — read the `--brand*` tokens.
- Resolve the vars **server-side** (you have the session user, phase, and picks there) and pass
  them in, so the first paint is already themed (no flash).

### 3 · Draft (pre-draft `draft` tab)
The pre-draft `draft` tab renders **`StandbyScreen`** (`standby-screen.tsx`): live countdown to
the draft (`draftAtISO`), the standby copy (`settings.draft_standby_text`), and the user's draft
position (group-stage rank). Its CTA opens **`DraftPrefsScreen`** (`draft-prefs-screen.tsx`) —
the full Draft Order page: drag-to-rank snake positions + team wishlist. Port both. The
reorder interaction is client-side UI; persist the resulting order through my existing
"save draft preferences" mutation in `onPositionsChange` / `onTeamsChange` (debounced) — keep
storage/shape unchanged.

### 4 · Bracket (knockout `bracket` tab)
Port `bracket-screen.tsx`. Pass my real `bracket` tree (rounds R32→Final; a slot is a team code
or `{ win: "<matchId>" }`), a `teamName(code)` lookup, and `myTeams` (viewer's drafted codes).
**All path-tracing logic — `resolve`, `canReach`, `nextOf`, round-dot involvement, the dim/
highlight of involved matches — is the design; port it verbatim.** Tapping a team traces its
route to the Final; the viewer's teams show ★.

### 5 · Podium leaderboards (`standings` tab)
Port `standings-screen.tsx`. It wraps the shared `<Podium>` atom in a tinted `PodiumCard` for
each leaderboard: **Overall** (gold), **Efficiency / 1st side pot** (green), and — when
`combined` (knockout) — **Discipline / 2nd side pot** (red), each with 4th-onward rows beneath.
Pass already-sorted rows from my standings query; the component does not compute scoring. Render
order inside a podium is 2-1-3 with #1 tallest — do not "fix" it.

## Workflow
Port in this order: **2 (theming wrapper) → 5 (standings) → 1 (my team) → 4 (bracket) →
3 (draft)**. After each piece:
1. Re-read the route file and confirm **only presentation + provided component logic** changed —
   none of my data/scoring/mutations.
2. Verify against the provided `.tsx`: same structure, no inline hex (except data-driven props),
   tap targets ≥44, titles in `font-display`, AA holds in light + dark and under a per-user flag
   theme (test e.g. Argentina pale-blue and Germany near-black via `computeBrand`).
3. Move on.

Finish with a **summary listing every file changed**, confirming no logic/data/behavior changed,
and noting any `// TODO(stub):` data placeholders you left and the prop shape each one needs.
