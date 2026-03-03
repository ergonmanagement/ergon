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

