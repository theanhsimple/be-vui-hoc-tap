# little

**Little Explorer World** — _A little step. A big discovery._

A premium 3D playful learning platform for children aged 5–6 in Vietnam (iPad & desktop), with parent and admin experiences. Product and technical docs live in [`docs/`](docs/).

> Status: **Sprint 05 — Parent dashboard & placement activity** (on top of Sprint 04's backend). Parent progress report, placement activity, break reminder, second-guardian invitations, data export and deletion. Parent accounts, families and child profiles on Supabase; lessons graded and recorded in Postgres. Runs against a **local** Supabase stack (no hosted project yet). See [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md) and [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

> **Published edition: GitHub Pages (device edition).** No backend needed — everything runs on the child's device. See [`docs/DEPLOY_GITHUB_PAGES.md`](docs/DEPLOY_GITHUB_PAGES.md). The Supabase server edition below stays available for later.

## Requirements

- Node.js 22+
- pnpm 10 (`corepack enable`)
- Docker (for the local Supabase stack)

## Getting started

```bash
pnpm install
pnpm db:start && pnpm db:reset   # local Supabase + migrations + dev seed
cp .env.example .env.local       # fill URL + publishable key from `pnpm exec supabase status`
pnpm dev
```

- App: http://localhost:3000 — register at `/auth/register`; confirmation emails land in Mailpit (http://127.0.0.1:54324)
- Design system showcase: http://localhost:3000/design-system (dev only; set `ENABLE_DESIGN_SYSTEM=true` **at build time** to include it in a production build)

## Scripts

| Command                        | What it does                                   |
| ------------------------------ | ---------------------------------------------- |
| `pnpm dev`                     | Dev server                                     |
| `pnpm build` / `pnpm start`    | Production build / serve                       |
| `pnpm typecheck`               | Generate Next route types, then `tsc` (strict) |
| `pnpm lint`                    | ESLint (Next core-web-vitals + TypeScript)     |
| `pnpm test`                    | Vitest unit tests (jsdom)                      |
| `pnpm format` / `format:check` | Prettier (+ Tailwind class sorting)            |
| `pnpm check`                   | typecheck + lint + test + format check         |
| `pnpm db:start` / `db:stop`    | Local Supabase stack (Docker)                  |
| `pnpm db:reset`                | Rebuild the local DB: migrations + dev seed    |
| `pnpm test:db`                 | RLS / learning-engine tests on the local stack |
| `pnpm db:types`                | Regenerate database TypeScript types           |
| `pnpm db:seed:generate`        | Regenerate `supabase/seed.sql` from demo data  |

## Structure

```
src/
  app/                    routes (App Router); /design-system is the internal showcase
  components/
    ui/                   Little* foundation components and form controls
    navigation/           student/parent/admin navigation, breadcrumb, parent gate
    layout/               StudentShell, ParentShell, AdminShell
    learning/             mascot, audio, answers, question card, feedback, activities
    parent/ admin/        dashboard and CMS building blocks
  design-system/          tokens (TS mirror), motion presets, learning worlds
  illustrations/          illustration registry + placeholder art
  features/auth/          sign-up/in/out, password reset, session DAL, safe redirects
  features/family/        family & child queries and Server Functions
  features/learning/      backend (content, student view, actions), session reducer, progress helpers
  data/demo/              dev-seed source + test fixtures (never imported by app code)
  lib/                    audio engine, parent-gate logic, env validation, Supabase clients
  proxy.ts                session refresh + route protection
supabase/                 config, migrations, generated dev seed
test/db/                  database security & learning-engine tests (local stack)
  styles/tokens.css       design tokens (Tailwind v4 theme)
legacy/prototype.html     original "Bé Vui Học Tập" prototype, kept as reference
docs/                     PRD, architecture, backend, security/RLS, API, Supabase setup, schema, UX/UI, design system, learning engine, roadmap, decisions
```

## Legacy prototype

`legacy/prototype.html` is the original single-file prototype. Open it directly in a browser. Note: its optional Firebase sync is unauthenticated (see risk R1 in `docs/ARCHITECTURE.md`).
