# little — Supabase Setup & Migrations

> **What has been done:** migrations, seed and tests run on a **local** Supabase stack (Supabase CLI `2.122.1`, Docker). **Nothing has been applied to a hosted Supabase project** — none was provided. Follow §5 when one exists.

## 1. Prerequisites

- Node 22+, pnpm 10, Docker (running).
- The Supabase CLI is a pinned dev dependency (`pnpm exec supabase …`).

## 2. Local development

```bash
pnpm install
pnpm db:start          # starts Postgres, Auth, PostgREST, Storage, Mailpit (Studio and other extras are skipped)
pnpm db:reset          # applies supabase/migrations/* then supabase/seed.sql (DESTROYS LOCAL DATA ONLY)
pnpm exec supabase status   # prints API_URL, PUBLISHABLE_KEY, Mailpit URL
```

Create `.env.local` (never committed; `.env*` is git-ignored):

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from supabase status>
```

Then `pnpm dev` (or `pnpm build && pnpm start`). Sign-up confirmation and password-reset emails arrive in **Mailpit** at http://127.0.0.1:54324. Allowed redirect URLs for local auth are in `supabase/config.toml` (`[auth] additional_redirect_urls`); add yours if you use another port.

Useful scripts:

| Script | Does |
|---|---|
| `pnpm db:start` / `db:stop` | start/stop the local stack (data kept between stops) |
| `pnpm db:reset` | rebuild the **local** database from migrations + seed |
| `pnpm db:types` | regenerate `src/lib/supabase/database.types.ts` from the local schema |
| `pnpm db:seed:generate` | regenerate `supabase/seed.sql` from `src/data/demo/*` |
| `pnpm test:db` | security + learning-engine tests against the local stack (needs `db:start` + `db:reset`) |

`pnpm test` (unit) does not need Supabase. `pnpm test:db` refuses to run against a non-local URL.

## 3. Environment variables

| Variable | Where | Secret? | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | web | no | base for email redirect links |
| `NEXT_PUBLIC_SUPABASE_URL` | web | no | project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | web | no (public by design) | publishable / legacy anon key; RLS enforces access |
| `ENABLE_DESIGN_SYSTEM` | web (build) | no | exposes `/design-system` in production builds |

The web app needs **no** service-role / secret key. Do not add one to the web runtime. If a future server job needs it, keep it in that job's secret store, never with a `NEXT_PUBLIC_` prefix. Variables are validated with Zod (`src/lib/env.ts`); when Supabase is not configured, pages show the error screen instead of crashing the build.

## 4. Migrations

`supabase/migrations/` (versioned, additive, no `drop`/`truncate`/`delete` of existing data):

| File | Contents |
|---|---|
| `20261122000100_core_schema.sql` | schemas, enums, tables, constraints, indexes, `updated_at` triggers, new-user profile trigger, `child_module_progress` view, mastery config row |
| `20261122000200_security.sql` | privilege lockdown, helper functions, RLS enable + policies, column grants |
| `20261122000300_learning_engine.sql` | grading, sessions, mastery, rewards, overview, daily plan, staff/publishing RPCs, execute grants |
| `20261122000400_storage.sql` | `public-learning-assets`, `public-audio` buckets + staff-only write policies |

Status: **created ✅ · applied locally ✅ (`supabase db reset`, repeatedly) · applied remotely ❌**.

`supabase/seed.sql` is **separate from migrations** and is development/staging data (the Sprint 03 demo library, published). It is idempotent (upserts on slugs, never deletes) — verified by running it twice — and ends with a check that every seeded question has a consistent private key.

## 5. Applying to a hosted project (when available)

1. Create the project (region per DECISIONS P-1). In **Auth → Providers → Email**: enable email confirmations; minimum password length 8 with letters + digits; secure password change on. In **Auth → URL configuration**: Site URL = production origin; add `<origin>/auth/callback` to redirect URLs. Configure custom SMTP (Mailpit is local only).
2. Link and review: `pnpm exec supabase link --project-ref <ref>` then `pnpm exec supabase db push --dry-run` and read the plan.
3. Apply to a **dev/staging** project first: `pnpm exec supabase db push`. Do not run `db reset` against hosted projects.
4. Seed **dev/staging only**: `psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql`. Production content should come through the publishing workflow after education review (DECISIONS P-4), not this seed.
5. Run Supabase's Security and Performance advisors; fix anything flagged before production.
6. Set the three `NEXT_PUBLIC_*` variables in the hosting provider.

Rollback: migrations are additive; to undo, write a new forward migration. Never edit an applied migration.

## 6. First admin (bootstrap)

No API role can create an admin. As the database owner (SQL editor / `psql`):

```sql
insert into public.staff_roles (user_id, role)
select id, 'admin' from auth.users where email = '<admin email>';
```

Further roles: the admin calls `grant_staff_role(user_id, role)` (admin UI arrives in Sprint 06).

## 7. Storage

| Bucket | Public read | Write | Limits |
|---|---|---|---|
| `public-learning-assets` | yes (published art) | content editors | 5 MB; png/webp/svg/jpeg |
| `public-audio` | yes (recorded instructions) | content editors | 10 MB; mpeg/mp4/aac/ogg/webm |

Object names: `<module-slug>/<lesson-slug>/<asset>.<ext>`, lowercase `[a-z0-9_.-]` (enforced by policy). No child or family files are stored; private buckets (family/assessment) are designed in BACKEND_ARCHITECTURE §7 and will be created with the first feature that needs them. Note: SVG uploads should be sanitised by the CMS before publishing (Sprint 06).
