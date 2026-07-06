# Seekingbusiness CRM

Full commercial management platform for Seekingbusiness — industrial bearings import broker.

## Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + Realtime + pgvector)
- Drizzle ORM
- Tailwind CSS v4 + shadcn/ui
- Anthropic Claude API (AI features: score explanation, cross-sell, demand forecast, conversation summary)
- OpenAI (embeddings via `text-embedding-3-small`)
- Resend (transactional email)
- Vercel (deployment + Cron Jobs)

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in all values.
2. Create a Supabase project and add connection strings to `.env.local`.
3. Run migrations: `pnpm db:generate && pnpm db:migrate`
4. Apply RLS policies: run `src/db/rls/policies.sql` in the Supabase SQL editor.
5. Seed scoring config: `pnpm tsx src/db/seeds/scoring-config.ts`
6. Start dev server: `pnpm dev`

## Project Structure

```
src/
  app/
    (public)/          Customer-facing pages (catalog, interest list, quote portal, voice)
    (admin)/           Internal CRM (dashboard, clients, quotes, campaigns, analytics, settings)
    (auth)/            Login / registration
    api/               Route handlers: webhooks, cron jobs, AI endpoints, PDF, notifications
  components/
    ui/                shadcn/ui primitives (button, card, badge, sheet, skeleton, …)
    features/          Domain components (catalog, quotes, clients, campaigns, voice, settings)
  db/
    schema/            Drizzle schema definitions (one file per domain)
    migrations/        Auto-generated Drizzle migrations
    seeds/             Seed scripts (scoring config)
    rls/               Supabase RLS policies SQL
  lib/
    supabase/          Server / client / admin Supabase helpers
    ai/                Claude + OpenAI wrappers (embeddings, scoring explainer, cross-sell, forecast, summary)
    email/             Resend client + email templates (React Email)
    notifications/     In-app notification helper (notify())
    scoring/           Client scoring engine (volume + frequency + payment)
    quotes/            Quote CRUD + approval flow actions and queries
    campaigns/         Campaign creation, segment resolver, pause/resume/cancel actions
    clients/           Client queries and actions
    alerts/            No-purchase alert logic
    interest-lists/    Customer interest list + quote request actions
    pricing/           Price list rules and margin resolution
    search/            Text search + semantic (pgvector) search
    wati/              Wati.io stub (deferred post-MVP)
    afip/              AFIP CUIT validation + caching
    bcra/              BCRA risk status + caching
    auth/              Role helpers, get-user, auth actions
```

## Environment Variables

All required variables (set in `.env.local` for local dev, Vercel project settings for production):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (direct connection for Drizzle migrations)
DATABASE_URL=

# Anthropic Claude
ANTHROPIC_API_KEY=

# OpenAI (embeddings)
OPENAI_API_KEY=

# Resend (email)
RESEND_API_KEY=
EMAIL_FROM=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vercel Cron security
CRON_SECRET=

# Wati.io (deferred — not required for MVP)
# WATI_API_URL=
# WATI_API_TOKEN=
```

## Cron Jobs (configured in vercel.json)

| Schedule | Endpoint | Description |
|----------|----------|-------------|
| Daily 03:00 UTC | `/api/cron/recalculate-scores` | Recalculates all client scores |
| Daily 04:00 UTC | `/api/cron/no-purchase-check` | Detects clients who haven't purchased recently |
| Weekly Mon 02:00 UTC | `/api/cron/demand-forecast` | AI demand forecast per category |
| Every 5 min | `/api/cron/process-email-queue` | Processes the email send queue |

## Deployment

1. Connect the repo to Vercel.
2. Set all environment variables in Vercel project settings.
3. Vercel automatically picks up `vercel.json` cron configuration.
4. Apply RLS policies in Supabase before going live.
5. Generate + run migrations against the production database using `DATABASE_URL` pointing to the production instance.

## User Roles

| Role | Access |
|------|--------|
| `admin_general` | Full access to all CRM features, scoring config, approvals |
| `admin_secundario` | Same as admin_general minus scoring config |
| `vendedor` | Clients assigned to them, quotes, voice consultations |
| `cliente` | Public catalog, interest list, quote portal |
# steyrbearingsgroup
