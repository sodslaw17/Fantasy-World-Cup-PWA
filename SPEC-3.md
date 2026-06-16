# Fantasy World Cup 2026 — Project Spec

> This is the single source of truth for the app — for both **Claude Code** (build) and
> **Claude Design** (front-end design; see §11). The rulebook below is transcribed
> verbatim-in-meaning from the organizer's screenshots. When in doubt, this file wins.
> Tournament: FIFA World Cup 2026 (48 teams, 12 groups of 4, Round of 32 first knockout).

---

## 1. Product summary

A **mobile-first, installable PWA** for a private fantasy World Cup pool of **~10 users**.
Users log in, submit group-stage score predictions, see leaderboards/stats, get a draft
standby screen, then track their drafted knockout teams. A few users are **Admins**
(set by env var) with back-office tools.

**Constraints**
- Optimize for **free / cheap tiers** (only ~10 users, ever).
- Installable to the iPhone home screen (PWA manifest + service worker).
- Auth required for everything. No anonymous access.

---

## 2. Recommended stack (propose alternatives before building)

- **Next.js (App Router)** deployed on **Vercel** free tier — PWA-friendly, generous for 10 users.
- **Supabase** free tier — Postgres + passwordless (magic-link) Auth + Row-Level Security.
- **Tailwind CSS**, themed on the World Cup 2026 "TRIONDA" design system (see §11).
- PWA via web manifest + service worker (e.g. `next-pwa` or `@serwist/next`).
- **Push notifications** via the Web Push API (VAPID keys — free, no third-party needed) for the prediction-deadline countdown; scheduled send via Vercel Cron or Supabase pg_cron (both free tier).
- Roles via env var email allowlists: `ADMIN_EMAILS`, `SUPER_ADMIN_EMAILS`.

If Claude Code prefers a cleaner alternative for any piece, surface it and ask first.

---

## 3. Roles

- **Regular user** — full front end once authenticated.
- **Admin** (email in `ADMIN_EMAILS`) — admin tools (§9).
- **Super Admin** (email in `SUPER_ADMIN_EMAILS`) — reserved for future elevated access; scaffold the guard, leave the toolset minimal for now.

---

## 4. Tournament phases & the screen each phase shows

The home screen is **time-driven**. A single source of "current phase" (derived from
admin-configurable timestamps) decides what renders.

| Phase | Window | Home screen |
|---|---|---|
| **Buy-in / Predictions** | until first match kickoff | Countdown to prediction deadline + the group prediction entry UI |
| **Group matches** | first kickoff → end June 27 | Leaderboard, my/others' predictions for today, today's actual scores, my stats |
| **Draft standby** | after last June 27 game → first knockout kickoff June 28 | Admin-editable text telling users to await an SMS confirming draft picks |
| **Knockout** | first knockout kickoff (June 28) → Final (July 19) | Who plays today (w/ optional custom team icons), my stats, full leaderboard |

**Prediction deadline:** the kickoff of the first group match (June 11). Store as one
**UTC timestamp**, admin-editable. ("2pm Central" = "3pm EST" = the same instant.)

**Per-user theming changes by phase:** during Buy-in/Predictions, Group matches, and Draft
standby, everyone sees the shared TRIONDA palette. Once the **Knockout** phase begins **and**
a user's drafted teams are recorded, that user's accent colors switch to a palette derived
from the flag of the **first country they drafted** (see §11.3).

---

## 5. THE RULEBOOK (transcribed)

### 5.1 Buy-in (June 1–10)
- Buy-in is **$30 per player**.
- **Ways to win money:**
  - **Winner Overall** — most points accumulated **across both stages** (group prediction points + knockout points, summed into one total). **Tiebreaker: combined goal difference of the user's 3 drafted knockout teams** (goal difference per team = goals for − goals against, across that team's knockout matches; sum across the user's teams). **Payout: $240.**
  - **1st Side Pot** — **Most efficient player**: each user has **already individually drafted one single footballer** from the entire World Cup player pool (this selection draft is complete and is **fully independent** of the knockout team draft). The winner is the user whose chosen player ends the tournament with the highest `(goals + assists) / minutes played`. The metric is **entered manually by admins** (no reliable affordable API for this exact spec). **Payout: $30.**
  - **2nd Side Pot** — **Worst discipline**: most cards accumulated by your drafted teams. Card points: `1st yellow = 1`, `2nd yellow = 2`, `straight red = 4`. **Payout: $30.**

### 5.2 Group stage (June 11–27)
Every player predicts the **scoreline of every group-stage match** (predict goals for each
team). Must be submitted before the first game (June 11). Group-stage total dictates draft
position order. Tiebreaker: **closest to actual total goals scored across the entire group stage.**

**Scoring per match prediction:**
- `+2` for the correct **outcome** (win / loss / draw).
- `+1` for the correct **exact score** (goals must align to the correct team).
- An exact score implies a correct outcome, so per-match max = **3**.

**Worked example (Mexico vs South Africa, actual = Mexico 1, South Africa 2):**
| Player | Prediction | Outcome right? | Exact? | Points |
|---|---|---|---|---|
| 1 | MEX 2 – RSA 1 | no (predicted MEX win) | no | **0** |
| 2 | MEX 1 – RSA 3 | yes (RSA win) | no | **2** |
| 3 | MEX 1 – RSA 2 | yes | yes | **3** |

### 5.3 Post-group draft (morning of Sun June 28)
- Group-stage scores are totaled. Highest finisher picks their **snake-draft** position
  first (position 1 = first pick AND last pick; position 8 = 8th & 9th picks; etc.).
- After positions are chosen, users draft from the **32 Round-of-32 teams**.
- Teams drafted **per user** depends on player count:
  - 7–8 players → **4 teams each**
  - 9–10 players → **3 teams each**
  - 11–16 players → **2 teams each**
- The draft itself is **run manually by admins over SMS**; the app **displays** the locked
  results — it does not run a live draft.

### 5.4 Knockout rounds (June 28 – July 19)
Points = wins + goals by your drafted teams, plus penalty-shootout adjustments. Winner =
highest combined total (group + knockout) after all games. **Overall tiebreaker: combined
goal difference of the user's 3 drafted teams** (per team: goals for − goals against across
its knockout matches; summed across the user's teams).

Rounds: **Round of 32** (Jun 28–Jul 3), **Round of 16** (Jul 4–7), **Quarter-Finals**
(Jul 9–11), **Semi-Finals** (Jul 14–15), **Final** (Jul 19).

**Per drafted team, per knockout match (same for every round above):**
- `+2` your team wins the game
- `+1` your team **loses a penalty shootout** (drew through ET, lost on pens)
- `+0` your team loses in open play (up through extra time)
- `+ (goals scored by your team)` — **excludes post-ET shootout penalty goals**

**3rd-place game / Bronze Final (July 18):**
- `+1` win, `+0` loss, `+ goals` (excludes shootout goals). *(Note: winning bronze = +1, not +2.)*

**Additional scoring — during penalty shootouts (per player event, attributed to the team's drafter):**
- `-1` if a player's shot is off-target and untouched by keeper (post/crossbar = off-target)
- `-1` if a player **fails** a Panenka attempt (missed or saved)
- `+1` if a player **attempts a Panenka AND scores**

> *Panenka:* a penalty technique where the taker gently chips the ball up the middle,
> banking on the keeper diving to a side.

---

## 6. Group-stage prediction UX
- Predictions entered **per group** (4 teams = 6 matches per group; 12 groups = 72 matches).
- **Autosave** as the user types (debounced upsert).
- Editable until the deadline, then **hard-locked** server-side (never trust client clock).
- Show clear saved/locked state.

---

## 7. Views to build (front end)

**Group phase**
- Leaderboard (group points)
- My predictions for today's games
- Others' predictions for today's games
- Today's games: actual kickoff times + live/final scores
- My stats: rank, total points, points behind leader

**Knockout phase**
- Who has matches today — each team optionally shows an **admin-uploaded custom icon stacked over the country flag/federation logo**
- My stats: rank, total points, points behind leader
- Full leaderboard (combined / overall)

**Names always carry their icon (everywhere they appear):**
- A **user's name** always shows that user's floating-head avatar inline beside it.
- A **player's name** (efficiency pick) always shows that player's floating-head icon inline beside it.
- A **country's name** always shows that country's logo inline beside it.
- Build these as three reusable "name + icon" components (`UserName`, `PlayerName`, `CountryName`) with consistent size/alignment/spacing and a sensible fallback when an icon hasn't been uploaded yet.

---

## 8. Data model (Postgres)

Core tables (refine as needed):
- `teams` (id, fifa_code, name, flag_url, **logo_url** (country logo shown beside the name), custom_icon_url (knockout icon stacked over the flag), **theme_primary_hex**, **theme_secondary_hex** (colors extracted from the flag, used for per-user theming — stored so the front end never extracts color from images at runtime), group_letter)
- `groups` (letter A–L)
- `matches` (id, stage, round, group_letter?, home_team, away_team, kickoff_utc, status, home_goals, away_goals, went_to_shootout, shootout_winner, ...)
- `predictions` (user_id, match_id, home_goals_pred, away_goals_pred, updated_at) — unique (user_id, match_id)
- `users` / profiles (id, email, display_name, **avatar_url** (floating-head shown beside the user's name), is_admin, is_super_admin derived from env)
- `drafts` (user_id, team_id, pick_number) — admin-entered, locked. The user's **first pick** (lowest pick_number) drives their knockout theme (§11.3).
- `efficiency_picks` (user_id, player_name, **icon_url** (floating-head shown beside the player's name), team_id?, goals, assists, minutes) — the single footballer each user drafted for the 1st Side Pot; goals/assists/minutes are **admin-entered**. Efficiency = (goals + assists) / minutes.
- `penalty_events` (match_id, team_id, player_name?, type: off_target | panenka_fail | panenka_score) — **admin-entered**
- `player_stats` (team_id, player?, goals, assists, minutes, yellows, second_yellows, straight_reds) — **admin-entered**, for the 2nd Side Pot (discipline)
- `settings` (prediction_deadline_utc, draft_standby_text, current_phase_override?, ...)

---

## 9. Admin tooling
- Manage users: list of email + display name (these define who can log in).
- Confirm/lock the **draft order** and each user's drafted teams.
- **Review & override auto-synced data** (§10): scores, per-team cards, and efficiency-player goals are
  auto-filled from the API; admin sees `auto` vs effective values, can **override** any field (manual wins,
  sticky), clear an override to fall back to auto, and trigger a manual re-sync. Maintain the API↔internal
  **ID mapping** for teams and efficiency players.
- Enter the data the API can't provide **manually**:
  - penalty-shootout events (off-target / Panenka fail / Panenka score) per drafted player
  - any score/stat the API got wrong or hasn't posted yet (via the override above)
- Upload & manage image assets:
  - a **floating-head avatar per user**
  - a **floating-head icon per efficiency-player pick**
  - a **country logo per team** (shown beside the country name) and the **knockout custom icon per team** (stacked over the flag)
  - per-team **theme colors** (`theme_primary_hex` / `theme_secondary_hex`) — admin can accept auto-extracted-from-flag defaults or override (§11.3)
- Edit the **draft standby text** and the **prediction deadline**.

---

## 10. Data ingestion & automated sync
**Static data (importers):** ship documented CSV/JSON importers + sample rows for teams (with group),
the 72 group fixtures, and the knockout bracket structure. **Do not hardcode the draw** — load it from the importer.

**Live data (automated sync, with manual override):** a server-side job pulls match scores, cards
(yellow / 2nd yellow / red, per team), and goals for each user's efficiency-player pick from a football
data API, to cut manual admin work. Design:
- **Provider:** a free-tier football API that covers WC2026 events + player stats (see notes below).
  API key in **server-side env vars only**.
- **ID mapping (required first step):** a mapping table linking the API's team IDs and player IDs to our
  internal `teams` and `efficiency_picks` rows. Auto-sync cannot match without it; seed/confirm via admin UI.
- **Scheduler:** Vercel Cron or Supabase pg_cron. Poll **frequently only during live-match windows**
  (e.g. every 1–5 min) and rarely otherwise, to respect free-tier rate limits. Cache responses.
- **Override model (manual always wins):** for every synced field, store both an `auto_value` and an
  optional `manual_value`; the **effective value = manual_value ?? auto_value**. Admin editing sets
  `manual_value` (sticky — sync never overwrites it); clearing it falls back to `auto`. Scoring/standings
  always use the effective value. Show `auto` vs `effective` side-by-side with a "last synced" timestamp
  and flag discrepancies for admin review.
- **Trust posture:** payouts ride on these numbers, so treat the API as a convenience that **pre-fills**;
  the admin remains the source of truth via override. Penalty-shootout/Panenka events stay manual (no
  affordable API exposes them).

**Efficiency-player goal tracker:** using the mapping above, sync each user's chosen player's **goals**
(most reliable), plus assists/minutes where available, and surface a side-pot tracker/leaderboard ranking
users by their player's `(goals + assists) / minutes` — with manual override on any value.

**Provider notes (verify current pricing/limits at build time):**
- *API-Football (api-sports.io)* — free tier ~100 req/day, covers WC2026 with match events (goals, cards,
  subs), lineups, and player stats (goals/assists/minutes); best free fit for all three needs. Smart polling
  + caching keeps under the limit; cheap paid tier if needed.
- *football-data.org* — free tier ~10 calls/min, good for fixtures/scores/standings; thinner on player-level
  cards/minutes.
- *Free community feeds* (e.g. GitHub/Apify WC2026) — free but **uptime not guaranteed**; fine as a fallback
  for scores/standings, risky for the card/player data that drives payouts.
- *Sportmonks / TheStatsAPI / Sportradar* — fuller player data but paid.

---

## 11. Front-end design & theming
> This section is also the design brief for Claude Design. The app must be unmistakably a
> **FIFA World Cup 2026** experience, mobile-first for iPhone, aesthetically polished, and
> fully legible at all times.

### 11.1 Visual style — anchored on the adidas TRIONDA match ball
Use the official 2026 World Cup match ball, the **adidas TRIONDA**, as the core style reference:
- A clean, **predominantly white base**, with vibrant **red, green, and blue** accents (the three
  host nations: USA, Canada, Mexico).
- **Gold** detailing reserved for trophy / winner / payout moments (1st place, champions, prize callouts).
- **Flowing, wave-inspired geometry** (the "tri-onda / three waves" motif) — soft curves, fluid
  dividers, wave shapes over hard rectangular blocks.
- Optional subtle **triangle "unity" motif** where the three accent colors meet (echoing the ball's panels).
- Sporty, celebratory, "most visually playful World Cup" energy — bold but clean.
- Take **inspiration only** — do NOT reproduce the actual TRIONDA artwork, host-nation emblems, or
  any FIFA logos/trademarks; use original shapes in the same spirit.

### 11.2 Color tokens
Expose everything as Tailwind tokens so values are easy to swap. Starting values (refine in design):
`paper #FFFFFF`, `ink #14151A`, `accent-red #E4002B`, `accent-blue #0A3D91`,
`accent-green #008A52`, `gold #C8A24B`. (These are a starting point, not FIFA's official hex.)

### 11.3 Dynamic per-user theming (knockout)
- During Buy-in/Predictions, Group, and Draft-standby phases, **all users share the TRIONDA palette**.
- Once **Knockout** begins **and** a user's draft is recorded, that user's **accent** palette switches
  to colors derived from the **flag of their first drafted country** (lowest `pick_number`), using the
  stored `theme_primary_hex` / `theme_secondary_hex`.
- Treat flag colors as an **accent/brand layer only** — they drive highlights, headers, active states,
  and the user's personal accent. The **base (white) background and body text stay on the fixed,
  accessible system** so legibility never depends on the flag.

### 11.4 User-uploaded icons & "name + icon" components
All icons are admin-uploaded (§9). Three reusable components render an icon inline next to a name
**everywhere that name appears**, with consistent size/alignment/spacing and a graceful fallback when
no icon is uploaded yet:
- `UserName` → user's floating-head avatar
- `PlayerName` → efficiency pick's floating-head icon
- `CountryName` → country logo

### 11.5 Accessibility — HARD RULE
Every **button, every word of text, and every icon must always be fully visible and legible**, in every
phase and under every per-user flag theme. Enforce **WCAG AA contrast or better automatically**; if a
flag-derived color would fail contrast against its background or against text/controls, **adjust it**
(darken/lighten/shift) rather than render something hard to see. Nothing ever washes out.

### 11.6 Mobile & interaction
- Mobile-first, iPhone-optimized (~390pt width); respect notch/safe areas and one-handed thumb reach.
- Simple, obvious primary navigation (e.g. a bottom tab bar).
- **Large tap targets:** all primary controls meet or exceed **44×44pt** with generous spacing. The
  prediction screen's frequent +/- score inputs must be especially thumb-friendly and hard to mis-tap.
- Native-app feel, light/dark friendly, premium and cohesive.

### 11.7 Dark / light mode (user toggle)
The app supports a user-controlled **light / dark / system** theme toggle, applied **app-wide**
(all user-facing and admin pages).
- Implement with semantic, theme-swapping tokens (CSS variables flipped via a `dark` class) —
  e.g. `next-themes` + Tailwind `darkMode: 'class'`, SSR-safe with **no flash** on load.
- Default to the user's **system preference**; persist their explicit choice (device-local
  cookie/localStorage is sufficient for ~10 users; optional profile sync later).
- Light base = TRIONDA white (`paper`); dark base = a deep neutral surface with near-white text.
  Provide dark equivalents for every neutral token (`ink`, `ink-2/3`, `line/line-2`, surfaces,
  shadows). Brand accents (`accent-red/green/blue`, `gold`) stay recognizable but adjust
  shade/opacity where needed for contrast. **Gold stays reserved for winner/payout moments.**
- The **§11.5 accessibility rule applies in BOTH modes** — including the §11.3 per-user flag
  theming, whose accent must pass WCAG AA against the dark surface (adjust if it would fail).
- Toggle control is accessible, ≥44×44pt, labeled, and reflects the current state; place it in
  Settings and/or the account/nav menu.

---

## 12. Scoring engine notes
- Implement scoring as **pure functions** with unit tests, fed by stored match/event data,
  so results recompute deterministically when an admin edits a score.
- Keep group-stage points and knockout points separately and also as a **combined overall**.
- **Overall ranking tiebreaker:** combined goal difference of the user's drafted teams, derived from stored match results (goals for − goals against per team across knockout matches) — no extra table needed beyond `matches`.
- Side pots are **separate payouts**, independent of the overall points race.

---

## 12b. Push notifications (deadline countdown)
- Web Push API with VAPID keys (free; no paid service). Store each user's push subscription server-side.
- Prompt for permission **after** the user installs the PWA (iOS only allows web push for installed PWAs); explain it's for the prediction-deadline reminder.
- Schedule reminder push(es) ahead of the deadline (e.g. 24h, 1h before) via a free scheduler (Vercel Cron or Supabase pg_cron) reading the admin-set `prediction_deadline_utc`.
- Tapping the notification deep-links into the prediction screen.

## 13. Open questions to resolve before/while building
1. ~~1st Side Pot scope~~ **RESOLVED:** each user pre-drafted one single footballer; winner = highest `(goals+assists)/minutes`; whole-tournament; admin-entered; independent of the team draft.
2. ~~Manual vs API for side pots / penalty events~~ **RESOLVED:** all such data is **manual admin entry**.
3. ~~Overall winner = sum of stages?~~ **RESOLVED:** group points + knockout points are **summed** into one overall total.
4. ~~Tiebreaker~~ **RESOLVED:** overall tiebreaker = combined goal difference of the user's 3 drafted teams (goals for − goals against per team, summed).
5. ~~Push notifications?~~ **RESOLVED:** YES — push notifications for the prediction-deadline countdown. iOS requires the PWA to be installed to the home screen and notification permission granted; the app should prompt for permission after install and clearly explain the countdown reminder.

*(All initial open questions are now resolved — proceed to build.)*

---

## 14. Build phases (suggested order)
0. Scaffold: Next.js + Supabase + PWA manifest/SW + magic-link auth + role guards + TRIONDA-anchored theme + token system.
1. Data model + importers (teams/groups/fixtures) + admin user management + asset uploads (avatars, player icons, country logos, team theme colors).
2. Group prediction UI (autosave + server-side deadline lock) + group scoring engine + tests.
3. Group-phase views (leaderboard, today's games, my/others predictions, my stats) + the `UserName`/`PlayerName`/`CountryName` icon components.
4. Draft standby screen (admin-editable text) + admin draft entry & lock.
5. Knockout views (today's teams w/ custom icons, stats, overall leaderboard) + **per-user flag theming** (§11.3) + knockout scoring + admin score entry.
6. Side pots + penalty-event scoring (manual entry) + payouts summary.
7. Push notifications for the prediction-deadline countdown (§12b).
8. App-wide light/dark mode toggle (§11.7) — semantic tokens, no-flash SSR, AA in both modes.
9. Automated live-data sync (§10): provider adapter + ID mapping + scheduler + auto/manual override model + efficiency-player goal tracker. Build manual entry/override FIRST, then layer the API on top so the app always works without it.

> Throughout: enforce the §11.5 accessibility rule (WCAG AA, nothing ever washes out) and the
> §11.6 tap-target minimums on every screen.
