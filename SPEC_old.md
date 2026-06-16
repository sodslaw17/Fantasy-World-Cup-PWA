# Fantasy World Cup 2026 — Project Spec

> This is the single source of truth for the app. The rulebook below is transcribed
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
- **Tailwind CSS** with a FIFA palette (see §11).
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

---

## 8. Data model (Postgres)

Core tables (refine as needed):
- `teams` (id, fifa_code, name, flag_url, custom_icon_url, group_letter)
- `groups` (letter A–L)
- `matches` (id, stage, round, group_letter?, home_team, away_team, kickoff_utc, status, home_goals, away_goals, went_to_shootout, shootout_winner, ...)
- `predictions` (user_id, match_id, home_goals_pred, away_goals_pred, updated_at) — unique (user_id, match_id)
- `users` / profiles (id, email, display_name, is_admin, is_super_admin derived from env)
- `drafts` (user_id, team_id, pick_number) — admin-entered, locked
- `efficiency_picks` (user_id, player_name, team_id?, goals, assists, minutes) — the single footballer each user drafted for the 1st Side Pot; goals/assists/minutes are **admin-entered**. Efficiency = (goals + assists) / minutes.
- `penalty_events` (match_id, team_id, player_name?, type: off_target | panenka_fail | panenka_score) — **admin-entered**
- `player_stats` (team_id, player?, goals, assists, minutes, yellows, second_yellows, straight_reds) — **admin-entered**, for the 2nd Side Pot (discipline)
- `settings` (prediction_deadline_utc, draft_standby_text, current_phase_override?, ...)

---

## 9. Admin tooling
- Manage users: list of email + display name (these define who can log in).
- Confirm/lock the **draft order** and each user's drafted teams.
- Enter all stat data needed for scoring **manually** (no API dependency required):
  - per match: open-play/ET result + shootout outcome + per-team goals (scoring engine recomputes)
  - penalty-shootout events (off-target / Panenka fail / Panenka score) per drafted player
  - 1st Side Pot: each user's chosen footballer + that player's goals, assists, minutes
  - 2nd Side Pot: per drafted team cards (yellows, second yellows, straight reds)
- Upload a **custom icon per team**.
- Edit the **draft standby text** and the **prediction deadline**.

---

## 10. Data ingestion
Build importers (CSV or JSON) so real data can be plugged in later. Define and ship a
documented schema + a few sample rows for: teams (with group), the 72 group fixtures, and
the knockout bracket structure. Results/stats flow in via admin forms now, with an optional
external API adapter later. **Do not hardcode the draw** — load it from the importer.

---

## 11. Theming — FIFA World Cup 2026 ("We Are 26")
The official **FIFA World Cup 26** brand is deliberately a *flexible system* (anchored on the
trophy-inside-"26" emblem and the "We Are 26" campaign) rather than one fixed palette — host
cities apply their own colors within it. So theme around its consistent anchors and expose
everything as Tailwind tokens so values are easy to swap:

- **Core anchors:** signature **gold** (the trophy), on a **black + white** base.
- **Tri-host / multicolor accents:** vibrant red, blue, and green nodding to USA / Canada / Mexico,
  used as secondary accents and category colors.
- Suggested starting tokens (adjust to taste; not FIFA's exact published hex):
  `gold #C8A24B`, `ink #0B0B0B`, `paper #FFFFFF`, `accent-red #E4002B`,
  `accent-blue #0A3D91`, `accent-green #008A52`.
- Mobile-first, large tap targets, good contrast, dark-mode-friendly. Confirm final hex with me.

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
0. Scaffold: Next.js + Supabase + PWA manifest/SW + magic-link auth + role guards + FIFA theme.
1. Data model + importers (teams/groups/fixtures) + admin user management.
2. Group prediction UI (autosave + server-side deadline lock) + group scoring engine + tests.
3. Group-phase views (leaderboard, today's games, my/others predictions, my stats).
4. Draft standby screen (admin-editable text) + admin draft entry & lock.
5. Knockout views (today's teams w/ custom icons, stats, overall leaderboard) + knockout scoring + admin score entry.
6. Side pots + penalty-event scoring (manual entry) + payouts summary.
