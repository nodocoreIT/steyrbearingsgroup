# Database Migrations

Migrations are generated and applied via Drizzle Kit.

## Running Migrations

### 1. Generate a migration from schema changes

```bash
yarn db:generate
```

This reads `src/db/schema/index.ts` and produces SQL files in this directory.

### 2. Apply migrations to the database

```bash
yarn db:migrate
```

This applies all pending migrations to the `DATABASE_URL` database.

### 3. Open Drizzle Studio (visual DB browser)

```bash
yarn db:studio
```

## Prerequisites

- `DATABASE_URL` must be set in `.env.local` pointing to your Supabase Postgres instance (direct connection, not pooler, for migrations).
- Use the **direct connection string** (port 5432) for `drizzle-kit migrate`, not the connection pooler.

## Migration Naming

Drizzle Kit names migrations sequentially: `0000_*.sql`, `0001_*.sql`, etc. Do not rename them manually.

## Seeding

After running migrations, seed the initial configuration:

```bash
npx tsx src/db/seeds/scoring-config.ts
```

This seeds the `scoring_config` table with default weights (volume: 40, frequency: 30, payment: 30).
