# WC26 Pool — Fantasy World Cup 2026

A mobile-first, installable PWA for a private 10-person fantasy World Cup prediction pool.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Hosting | Vercel free tier |
| Database + Auth | Supabase free tier (Postgres + magic-link) |
| Styling | Tailwind CSS v4 |
| PWA | @serwist/next (service worker + manifest) |
| Push notifications | Web Push API / VAPID (Phase 7) |

---

## Local setup

### 1. Clone and install

```bash
git clone <repo>
cd wc26-pool
npm install
```

### 2. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) (free tier).
2. Create a new project.
3. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run migrations

In the Supabase SQL editor, paste and run each file in `supabase/migrations/` in order.

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in the values
```

### 5. Seed initial users

In the Supabase SQL editor, insert a row per player:

```sql
insert into profiles (email, display_name) values
  ('player1@example.com', 'Alice'),
  ('player2@example.com', 'Bob');
-- repeat for all 10 players
```

Only these emails will be allowed to log in.

### 6. Generate placeholder PWA icons

```bash
npm run generate-icons
```

Replace `public/icons/*.png` with real artwork before launch.

### 7. Start dev server

```bash
npm run dev
```

Open http://localhost:3000. The app redirects to `/login`; only emails seeded in `profiles` can receive a magic link.

---

## Deployment (Vercel)

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add all env vars from `.env.local.example` under **Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel deployment URL.
5. Build uses `next build --webpack` (required for Serwist service worker compilation).

### Magic-link redirect URL

In **Supabase → Authentication → URL Configuration → Redirect URLs**, add:

```
https://your-app.vercel.app/auth/callback
```

---

## Role guards

Roles are driven entirely by env vars — no database column needed:

```env
ADMIN_EMAILS=alice@example.com,bob@example.com
SUPER_ADMIN_EMAILS=alice@example.com
```

Admins access `/admin/*`. Super-admin guard is scaffolded; extended toolset is TBD.

---

## Importing tournament data

Phase 2 will add CSV/JSON importers for:

- `teams.csv` — `fifa_code, name, group_letter, flag_url`
- `fixtures.csv` — `home_team, away_team, group_letter, kickoff_utc`

Sample files will live in `supabase/sample-data/`.

---

## PWA / iPhone install

1. Open the deployed app in Safari on iPhone.
2. Tap **Share → Add to Home Screen**.
3. Once installed, the app will prompt for push-notification permission (needed for deadline reminders — iOS only allows web push for installed PWAs).

HTTPS is required; Vercel provides it automatically.

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key — **server only, never expose** |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Full URL of the app (magic-link redirect) |
| `ADMIN_EMAILS` | ✅ | Comma-separated admin emails |
| `SUPER_ADMIN_EMAILS` | ✅ | Comma-separated super-admin emails |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Phase 7 | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | Phase 7 | VAPID private key — server only |
| `VAPID_SUBJECT` | Phase 7 | `mailto:` URI for VAPID |
