# Indelible - Lifelong Knowledge Mastery

A high-end, minimalist spaced-repetition PWA built with Next.js 14, TypeScript, and Supabase. Features the "Infinity Vault" system for permanent knowledge retention.

## 🌟 Features

- **8-Level Leitner System**: Progressive spaced repetition from daily to 2-year intervals
- **Infinity Vault**: Cards reaching Level 6+ enter permanent maintenance mode
- **Smart Smoothing**: Prevents burnout by intelligently managing daily card load
- **Knowledge Net Value**: Track your cumulative learning progress
- **PWA Support**: Install on any device for offline access
- **Dark Mode First**: Premium obsidian and gold aesthetic

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Two Supabase projects (QA and PROD)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create two Supabase projects: `Indelible-QA` and `Indelible-PROD`
2. Run each migration script, in order, in the project's SQL Editor (`supabase/migrations/001...` through `005...`):
   ```bash
   # Copy contents of supabase/migrations/001_initial_schema.sql, paste into
   # Supabase SQL Editor and execute. Repeat for 002, 003, 004, 005 in order.
   ```
   Note: `supabase/migrations/` is gitignored on purpose (it documents schema/RLS
   details we don't want broadly visible in the repo) — the files still exist
   locally and must be applied manually to each project. Treat them as the
   source of truth for schema even though git doesn't track them.

### 3. Configure Environment Variables

Create `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Feature flags

| Variable | Default | Description |
| --- | --- | --- |
| `PUSH_NOTIFICATIONS_ENABLED` | `false` (unset = off) | Set to `true` to show the "Daily Reminders" push notification section in Profile. Currently kept off while the notification pipeline is being stabilized — see `supabase/migrations/005_push_notifications.sql` and `supabase/functions/send-notifications` for the backend half. UI-only flag: it hides the toggle/section server-side, it does not block the API routes or Edge Function. |

### 4. Set Up Push Notifications (Edge Function + Cron)

Push notifications run entirely on Supabase infrastructure (Edge Function + `pg_cron`), independent of the Next.js app and `PUSH_NOTIFICATIONS_ENABLED` — that flag only controls the Profile UI. Set this up per project (QA and PROD separately).

1. **Generate VAPID keys** (once, reused across environments unless you want to rotate):
   ```bash
   npx web-push generate-vapid-keys
   ```
   Put the public key in `.env.local` as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key as `VAPID_PRIVATE_KEY`. `VAPID_SUBJECT` is a `mailto:` contact address.

2. **Enable extensions** — in the Supabase Dashboard, go to Database → Extensions and enable `pg_cron` and `pg_net` if not already on.

3. **Deploy the Edge Function** with `verify_jwt` turned **off**:
   ```bash
   supabase functions deploy send-notifications --project-ref <your-project-ref> --no-verify-jwt
   ```
   This must stay off. The function implements its own bearer-token check against `SUPABASE_SERVICE_ROLE_KEY` internally — if `verify_jwt` is left on (the dashboard/CLI default), Supabase's gateway rejects the request before the function ever runs, and pg_cron's calls silently 401 forever. This is exactly what happened in QA: the function sat fully broken for weeks with `verify_jwt: true` and nobody noticed because pg_cron's own job-run log always showed "succeeded" (it only confirms the HTTP request was *sent*, not that it got a 2xx back). Always check the Edge Function's own logs, not just `cron.job_run_details`, when debugging this pipeline.

4. **Set the function's secrets** (separate from `.env.local` — these live on Supabase, not Vercel):
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com --project-ref <your-project-ref>
   ```

5. **Schedule the cron job** (run once per project, in the SQL Editor):
   ```sql
   select cron.schedule(
       'send-push-notifications',
       '0,15,30,45 * * * *',
       $$
       SELECT net.http_post(
           url     := 'https://<your-project-ref>.supabase.co/functions/v1/send-notifications',
           headers := jsonb_build_object(
               'Content-Type',  'application/json',
               'Authorization', 'Bearer <SECRET_KEY>'
           ),
           body    := '{}'::jsonb
       );
       $$
   );
   ```
   **`<SECRET_KEY>` must be the project's `secret` API key from Settings → API Keys → "Publishable and secret API keys" tab (`sb_secret_...` format) — *not* the legacy JWT-format `service_role` key from the "Legacy anon, service_role API keys" tab.** Edge Functions on this project resolve the auto-injected `SUPABASE_SERVICE_ROLE_KEY` env var to the new secret-key format at runtime, so the function's internal auth check only matches against that format. Pasting the legacy JWT key here looks correct (it's a valid, current key) but will fail the function's internal check with a `401`/`"Unauthorized"` body indistinguishable at a glance from the `verify_jwt` gateway failure in step 3 — this exact mix-up was the QA outage. If you ever need to debug this again: redeploy with `verify_jwt: false`, then manually run the `net.http_post` call above and inspect `select * from net._http_response order by id desc limit 1;` for the real status/body instead of trusting `cron.job_run_details` ("succeeded" there only means dispatched, not accepted).

6. **Verify**: trigger the SQL above manually once and check `net._http_response` for `{"sent": ...}` with a `200`. To see a real push arrive, use the app (Profile → enable notifications, picking a reminder time on a `:00/:15/:30/:45` boundary since that's the cron tick granularity).

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### QA Environment

- **Branch**: `develop`
- **URL**: `qa.indelible.app`
- **Supabase**: Indelible-QA project

### Production Environment

- **Branch**: `main`
- **URL**: `indelible.app`
- **Supabase**: Indelible-PROD project

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Configure environment variables for each environment
3. Set up custom domains
4. Deploy!

## 🎯 The Leitner System

Cards progress through 8 boxes with increasing intervals:

1. **Box 1**: Daily (new/fragile)
2. **Box 2**: 2 days
3. **Box 3**: 4 days
4. **Box 4**: 8 days
5. **Box 5**: 16 days
6. **Box 6**: 6 months (VAULT)
7. **Box 7**: 1 year (VAULT)
8. **Box 8**: 2 years (VAULT)

### Review Logic

- **Success**: Move up 1 level (max 8)
- **Hard**: Stay at current level
- **Forgot**: Drop 2 levels (min 1)

### Smoothing Algorithm

When daily cards exceed 25:
1. Prioritize Box 1 (fragile cards)
2. Prioritize Box 6-8 (vault maintenance)
3. Push Box 2-5 cards by 24 hours

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Animations**: Framer Motion
- **PWA**: next-pwa

## 📱 PWA Installation

The app can be installed on any device:

1. Visit the app in your browser
2. Look for "Add to Home Screen" or "Install" prompt
3. Enjoy offline access and native app experience

## 🎨 Design System

- **Obsidian**: `#0A0A0B` (Background)
- **Gold**: `#E5C05E` (Primary accent)
- **Emerald**: `#10B981` (Success/Vault)

## 📄 License

MIT
