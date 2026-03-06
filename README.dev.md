# Next.js + Supabase Starter

This is a Next.js 15+ App Router starter integrated with Supabase Auth (cookie-based sessions via `@supabase/ssr`).

## Development

1) Install dependencies:

```bash
npm install
```

2) Configure environment:

Copy `.env.example` to `.env.local` and fill the values from your Supabase Project Settings → API:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

3) Run the app in dev mode:

```bash
npm run dev
```

Optional checks/builds:

```bash
npm run lint
npm run build
```

## Supabase CLI

The Supabase CLI is included in devDependencies. For pushing migrations to your hosted project, log in and link once:

```bash
npx supabase login
npx supabase link
```

### Local Supabase (containers)

Requires Docker. Start/stop local stack:

```bash
npm run supabase:start
npm run supabase:stop
```

## Database Migrations

Scripts are available in `package.json` to help generate and apply migrations.

- Generate a new migration (diff current DB → SQL file). Provide a descriptive name:

```bash
npm run db:migrate:generate -- --name add_profile_fields
```

You can pass extra flags (e.g., `--schema public`).

- Apply migrations to the linked project:

```bash
npm run db:migrate:run
```

- Reset local dev database and re-apply migrations:

```bash
npm run db:reset
```

## Notes

- Ensure `.env.local` has the two public keys: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- For protected pages/components, see patterns in `lib/auth.ts` and `lib/supabase/*`.
- If you use local containers, make sure Docker is running.

## Testing

- Frontend/unit tests live alongside features (e.g. `app/.../*.test.tsx`, `hooks/...*.test.ts`).
- Run all tests with:

```bash
npm test
```

The current suite covers:

- Auth flows and hooks.
- Jobs/Customers/Schedule/Finance/Marketing hooks and pages.
- Billing and Dashboard hooks and pages.

## Environments & deployment

- **Local dev**
  - Next.js dev server: `npm run dev`.
  - Supabase local stack (optional): `npm run supabase:start` / `npm run supabase:stop`.
  - Migrations: `npm run db:migrate:generate` / `npm run db:migrate:run` / `npm run db:reset`.

- **Staging / Production (recommended mapping)**
  - One Supabase project per environment (staging, production).
  - One Vercel project per environment, each wired to the appropriate Supabase project via env vars.

Deployment flow:

1. Commit code and push to the appropriate branch.
2. Run Supabase migrations against the target project.
3. Vercel picks up the push and deploys the Next.js app.

## Logging & errors

- Edge Functions return errors in a consistent shape:

```json
{ "error": "message", "code": "ERROR_CODE" }
```

- Error codes follow a module prefix (e.g. `AUTH_*`, `FINANCE_*`, `MARKETING_*`, `BILLING_*`, `DASHBOARD_*`).
- When logging server-side, include at minimum:
  - `user_id` (if available)
  - `company_id` (if available)
  - `function_name`
  - `error_code` (when applicable)
- Frontend surfaces errors by:
  - Showing short, user-friendly messages.
  - Optionally inspecting `code` to branch on specific cases (e.g. auth vs validation vs billing).

