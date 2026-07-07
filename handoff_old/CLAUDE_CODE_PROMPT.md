# Claude Code — Match the WC2026 Fantasy UI to the design, exactly

You are working in my existing **Next.js (App Router) + Tailwind CSS + TypeScript** codebase
for the Fantasy World Cup 2026 pool app. The TRIONDA design system is finished and authoritative.
Your job is to **restyle the markup and classes of every page so the build matches the design
exactly** — across login, all group-stage views, pre-draft, all knockout views, and all admin
pages. Previous passes came out "a little off" because they interpreted a *description*. This
package gives you the **real tokens and real markup** instead. Match them; do not paraphrase.

Authoritative sources, in priority order:
1. **`SPEC.md`** — product/data/scoring source of truth. **§9** (admin surface) and **§11**
   (front-end design, theming, accessibility) govern this work.
2. **This package** (`handoff/`): the rendered code and specs below.
3. The runnable prototype (`handoff/reference/prototype-src/**`) — the exact intended markup,
   layout, and behavior for every screen, authored in inline-style React. **Port its structure
   1:1; swap inline styles for the token utilities.** It is the "real markup" reference.

## Ground rules (do NOT violate)
1. **Presentation only — no logic changes.** Do not touch server actions, route handlers, data
   fetching, form submission, validation, state, scoring, or business rules. You are changing
   markup and classes. If a structural change is truly unavoidable to apply a component, keep
   behavior identical and call it out.
2. **Read my existing files first.** Before editing a page, read it and the components it renders.
   Restyle what's there; refactor it to use the shared components in this package. **Do not
   scaffold new routes or invent pages.**
3. **Do not invent content.** Render only what the design shows. The prior login build added a
   "Your timezone" select that does not exist in the design — that is exactly the failure mode to
   avoid. No extra fields, sections, copy, stats, or icons beyond what the reference shows.
4. **Reuse tokens — never inline a hex value.** Every color/radius/shadow/font comes from a token
   utility defined in `app/globals.css` (`bg-paper`, `text-ink`, `text-brand-ink`, `bg-brand-soft`,
   `rounded-lg`, `shadow-md`, `font-display`, …). The only allowed raw colors are genuinely
   data-driven values that arrive as props (a user's monogram color, a flag fill) — applied inline.
5. **Fonts must actually load.** Titles render in **Saira Condensed** (`font-display`, UPPERCASE),
   numerals in **Saira** (`font-num`, tabular), body in **Hanken Grotesk** (`font-body`). Use the
   `next/font` setup in `app/fonts.ts`; verify a title is NOT falling back to the body sans. The
   single biggest past defect was the display font silently not applying.
6. **Accessibility is a hard rule (SPEC §11.5/§11.6).** Every control ≥ **44×44px** (steppers 48,
   admin number-steppers 46). All text/icons meet **WCAG AA** against their background. Run every
   colored-text/colored-fill pairing through the guardrail in `lib/theme.ts` — never hand-pick a
   contrast. Nothing washes out, in light or dark, under any per-user flag theme.
7. **Gold is reserved** for trophy / winner / payout moments only — never general UI or admin actions.

## Use this package's code
- `app/globals.css` — **canonical tokens** (Tailwind v4 `@theme inline`). This file is the only
  place tokens are defined. If you are on Tailwind v3, keep the `:root`/`[data-base]`/`[data-flag]`
  custom-property blocks verbatim and mirror the names into `tailwind.config.js` (see the header
  comment in that file). Dark mode is `data-base="dark"` on a wrapper; `dark:` variants respond to it.
- `app/fonts.ts` — `next/font` setup; apply the variables on `<html>` in `app/layout.tsx`.
- `lib/theme.ts` — the AA contrast guardrail (`ensureContrast`, `onColor`, `mixHex`) and
  **`computeBrand(primary, secondary, base)`**. Port exactly; do not reimplement.
- `components/wc-ui.tsx` — shared atoms: `Btn`, `Card`, `Pill`, `PtsBadge`, `Stepper`, `WaveStrip`,
  `ScreenHeader`, `Banner`, `Scroll`, `Podium`, `TabBar`, and the name+icon atoms `UserName`,
  `PlayerName`, `CountryName`, `CountryLogo`, `CountryStacked`. Refactor pages to render THESE.
- `components/wc-form.tsx` — `Field`, `Input`, `Select`, `NumberStepper`, `Toggle`, `Avatar`,
  `SectionTitle` for login + admin.
- `app/login/login-screen.tsx` — the corrected login (the previously-wrong screen, fixed; `// FIX:`
  notes mark each prior drift).
- `app/predict/predict-screen.tsx` — worked port of the core Predict screen; use it as the pattern
  for porting the remaining screens from `reference/prototype-src/`.

## Per-user theming & name+icon rules (do not regress)
- **Theming:** group / pre-draft / standby phases share the TRIONDA palette (`--brand` = host accent,
  default blue). In **knockout**, once a user's draft is recorded, set the `--brand*` tokens from
  their **first-drafted country's** stored `theme_primary_hex` / `theme_secondary_hex` via
  `computeBrand(...)` as an inline style on the app-root wrapper: `<div data-base={base} style={brandVars}>`.
  Never extract color from an image at runtime. Anything that renders TEXT uses `--brand-ink`
  (or `--brand-on` on a brand fill), never raw `--brand`.
- **Name + icon (SPEC §11.4):** a name ALWAYS carries its icon, everywhere. `UserName` →
  `avatar_url` (round) with monogram fallback; `PlayerName` → efficiency pick's `icon_url`
  (squircle) with monogram fallback; `CountryName` → `logo_url` (crest) or flag chip;
  `CountryStacked` → crest + `custom_icon_url` lozenge (knockout). All four keep consistent
  size/alignment/spacing and a graceful fallback when no asset is uploaded.

## Responsiveness
- **User pages:** mobile-first, iPhone-optimized (~390pt). Drop the prototype's `PhoneFrame`
  bezel — it is prototype-only chrome.
- **Admin pages:** desktop-first but must not break on tablet (horizontal-scroll wrappers for wide
  tables are fine). Use `wc-form.tsx` + the admin shell.

## Workflow
Work **page by page**, in this order: login → group (standings, today, predict, payouts, rules) →
pre-draft (standby, draft preferences) → knockout (standings, today, bracket, my team) → admin
(shell, users, draft, match & stats, side pots, assets, settings).

After each page:
1. Re-read the file and confirm **only presentation changed** (diff the logic mentally).
2. Verify: no inline hex; tokens used; tap targets ≥44; titles in `font-display`; AA holds in
   light + dark.
3. Move on.

Finish with a **summary listing every file you changed**, confirming no logic/data/behavior changed,
and noting any place you had to restructure markup (and why behavior is still identical).
