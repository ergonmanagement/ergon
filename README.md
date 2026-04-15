# Ergon

A multi-tenant field-service SaaS built with Next.js, Supabase, and Tailwind CSS. Companies can manage jobs, customers, schedules, finances, and marketing from a single responsive dashboard.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 or later |
| npm | 9 or later (bundled with Node) |
| Supabase CLI | v2.90.0 or later |

Install the Supabase CLI:

```bash
brew install supabase/tap/supabase
```

---

## 1. Clone and install dependencies

```bash
git clone <repo-url>
cd ergon
npm install
```

---

## 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables in `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox public token for job location maps |

> **Never** put secret keys (service role key, Brevo API key, etc.) in `.env.local`. Those are configured as Supabase secrets (see §5).

---

## 3. Set up the database

### Option A — Remote Supabase project (recommended for development)

1. Create a project at [supabase.com](https://supabase.com).
2. Log in and link the project:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

3. Push all migrations:

```bash
npm run db:migrate:run      # runs `supabase db push`
```

### Option B — Local Supabase

```bash
npm run supabase:start      # starts local Postgres + Auth + Storage
npm run dev:reset           # applies all migrations to the local DB
```

---

## 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses Supabase Auth — sign up for an account to get started.

---

## 5. Deploy Edge Functions (review request worker)

The background worker that sends review-request emails after a job is marked **Paid** runs as a Supabase Edge Function.

### Set secrets

```bash
supabase secrets set BREVO_API_KEY=<your-brevo-api-key>
supabase secrets set BREVO_FROM_EMAIL=<your-verified-sender-email>
```

### Deploy the function

```bash
supabase functions deploy review-request-worker
```

### Schedule the worker (every 15 minutes)

In the Supabase Dashboard, go to **Database → Cron Jobs** and create a new job:

- **Name:** `review-request-worker`
- **Schedule:** `*/15 * * * *`
- **Command:**

```sql
select net.http_post(
  url := '<your-supabase-project-url>/functions/v1/review-request-worker',
  headers := '{"Authorization": "Bearer <your-supabase-anon-key>"}'::jsonb
);
```

---

## 6. Configure review automation per company

After signing up, run this SQL in the Supabase Dashboard → SQL Editor to enable email automation for your company:

```sql
UPDATE public.companies
SET
  review_automation_enabled = true,
  review_link               = 'https://g.page/r/your-google-review-link',
  review_request_delay_hours = 24
WHERE id = '<your-company-id>';
```

---

## Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint |
| `npm run db:migrate:run` | Push migrations to the remote DB |
| `npm run db:reset` | Reset and re-seed the local DB |
| `npm run supabase:start` | Start local Supabase services |
| `npm run supabase:stop` | Stop local Supabase services |

---

## Architecture overview

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui components
- **Backend:** Supabase Edge Functions (Deno), Postgres with RLS
- **Auth:** Supabase Auth (email/password)
- **AI (Marketing):** LangChain / LangGraph running inside an Edge Function
- **Email:** Brevo (Sendinblue) transactional API
- **Maps:** Mapbox Static Images API

Design documents live in `docs/`:
- `docs/highLevelDesign.md` — system overview and architecture decisions
- `docs/lowLevelDesign.md` — detailed data model, RLS policies, and API contracts (LLD wins on conflict)
