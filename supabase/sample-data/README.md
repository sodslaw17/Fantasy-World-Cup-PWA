# Sample data

These files are **placeholders** — replace them with the real 2026 WC draw before launch.
Import via **Admin → Import** in the app, or paste directly in the Supabase SQL editor.

---

## teams.csv

| Column | Required | Description |
|---|---|---|
| `fifa_code` | ✅ | 2–3 letter FIFA country code (e.g. `USA`, `FRA`). Primary key for upserts. |
| `name` | ✅ | Full country/team name |
| `group_letter` | ✅ | Single letter A–L |
| `flag_url` | optional | URL to a flag image (can leave blank; app falls back to text code) |

**Import order:** teams must be imported before fixtures (fixtures reference team codes).

**Re-importing:** safe — rows are upserted on `fifa_code`, so updating the group letter or name won't create duplicates.

---

## fixtures.csv

| Column | Required | Description |
|---|---|---|
| `group_letter` | ✅ | A–L |
| `home_team_code` | ✅ | FIFA code matching a row in `teams.csv` |
| `away_team_code` | ✅ | FIFA code matching a row in `teams.csv` |
| `kickoff_utc` | ✅ | ISO-8601 UTC timestamp, e.g. `2026-06-11T19:00:00Z` |

72 group-stage fixtures (6 per group × 12 groups).

**Re-importing:** safe — rows are upserted on `(home_team_code, away_team_code)`. Kickoff times will be updated; match results already entered will be preserved.

**Matchday 3 note:** Games 5 and 6 within the same group must kick off at the same UTC time so all teams in the group know the state of play simultaneously. The sample data reflects this.

---

## Knockout fixtures

Knockout matches (Round of 32 onward) are **not** imported via CSV — they are added by an admin through the match management UI once group stage results are known, with the actual team codes filled in.
