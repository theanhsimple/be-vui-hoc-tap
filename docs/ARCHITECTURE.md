# little — Technical Architecture

> **Status:** Proposed (Sprint 00). Nothing below is implemented unless marked ✅.

## 1. Repository audit (2026-11-22)

| Item | Finding |
|------|---------|
| Contents | `README.md` (title only), `index.html` (133 KB single-file prototype "Bé Vui Học Tập"). One commit on `main`. |
| Dependencies | None. No `package.json`, no lockfile, no build tooling. |
| Next.js config | None. |
| Supabase | Sprint 04: `supabase/` (config, 4 migrations, generated seed); local stack via the CLI. See BACKEND_ARCHITECTURE.md. |
| Existing backend | Prototype writes to a **Firebase Realtime Database** (`…asia-southeast1.firebasedatabase.app`, path `families/<code>.json`) with unauthenticated `PUT`/`GET`. The URL is hard-coded in `index.html`. No API keys or secrets were found in the repo. |
| Fonts / assets | Google Fonts *Baloo 2* + *Be Vietnam Pro*; mascot "Bạn Nắng" drawn as inline SVG; emoji used as pictures; no image/audio files. |
| Reusable | Game generators (count/add/sub/compare/missing number), English Pre-A1 word lists, Vietnamese UI copy & feedback lines, reward/gift catalogue, parent range setting. These are **ported as content/data**, not as code. |
| Toolchain (container) | Node 22.23.5, npm 10.9.9, pnpm 10.28.0, yarn 1.22, bun 1.4. Docker available (Sprint 04: the daemon can be started in this container; the local Supabase stack runs). `psql` available. |

## 2. Stack decisions

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | **Next.js (App Router)**, React Server Components | Pin the current stable major at install time (16.x as of audit). |
| Language | **TypeScript, `strict: true`** + `noUncheckedIndexedAccess` | Pin a TS version officially supported by the pinned Next.js (see risk R6). |
| Styling | **Tailwind CSS v4** with CSS-variable design tokens | Tokens in `src/styles/tokens.css`, mapped via `@theme`. |
| Motion | **`motion`** (`motion/react`) | Respect `prefers-reduced-motion`. |
| Auth | **Supabase Auth** via `@supabase/ssr` (cookie sessions) | Guardians and staff only; children never authenticate. |
| DB | **Supabase PostgreSQL** with RLS on every table | Migrations in `supabase/migrations`, SQL-first. |
| Storage | **Supabase Storage** | Buckets below. |
| Validation | **Zod** | Shared schemas for forms, server actions, question payloads. |
| Package manager | **pnpm** | Lockfile committed; `engines.node >= 22`. |
| Tests | Vitest (unit), Vitest + supabase-js against the local stack (RLS/engine, `pnpm test:db`), Playwright (browser flows) | pgTAP replaced by API-level tests as real users (Sprint 04). |
| Hosting | Vercel (web) + Supabase cloud, region Singapore | To confirm. |

Explicitly **not** added now: three.js / react-three-fiber (see D-005), a state-management library, an i18n library, a UI kit.

## 3. Application structure

### 3.1 Folder structure (target)

```
be-vui-hoc-tap/
├─ docs/                         # this documentation
├─ legacy/prototype.html         # moved from /index.html in Sprint 01
├─ public/                       # static icons, manifest, fonts fallback
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/                # timestamped SQL, additive only
│  ├─ seed.sql                   # dev-only content seed (no real child data)
│  └─ tests/                     # pgTAP RLS tests
├─ src/
│  ├─ app/
│  │  ├─ design-system/          # internal showcase (Sprint 02) ✅
│  │  ├─ (marketing)/ (auth)/    # landing, privacy, login… (later)
│  │  ├─ student/                # STUDENT experience ✅ Sprint 03 (see LEARNING_ENGINE.md)
│  │  ├─ parent/                 # PARENT experience (Sprint 05)
│  │  ├─ admin/                  # ADMIN experience (Sprint 06)
│  │  └─ api/                    # route handlers only where needed
│  ├─ components/                # ✅ Sprint 02
│  │  ├─ ui/                     # Little* foundation components, form controls, tones
│  │  ├─ navigation/             # Student/Parent/Admin/Bottom/Sidebar nav, Breadcrumb, ParentGate
│  │  ├─ layout/                 # StudentShell, ParentShell, AdminShell, Logo
│  │  ├─ learning/               # mascot, audio, answers, QuestionCard, feedback, activities
│  │  ├─ parent/                 # dashboard cards
│  │  └─ admin/                  # CMS building blocks
│  ├─ design-system/             # ✅ tokens (TS mirror), motion presets, worlds
│  ├─ illustrations/             # ✅ registry + placeholder art
│  ├─ features/learning/         # ✅ content repo, grading (server action), session, progress, demo store
│  ├─ data/demo/                 # ✅ demo content (public) + answer keys (server-only)
│  ├─ lib/
│  │  ├─ audio/ ✅  parent-gate/ ✅  env.ts ✅  cn.ts ✅
│  │  ├─ supabase/{config,server,database.types}.ts   (Sprint 04; no browser/admin client)
│  │  └─ (auth guards live in src/features/auth/session.ts)
│  ├─ styles/tokens.css          # ✅ design tokens
├─ tests/e2e/
└─ proxy.ts                      # session refresh + area protection (Next 16 renamed middleware → proxy)
```

### 3.2 Routing strategy

- Three top-level areas map to three layouts with distinct chrome: `/student` (implemented Sprint 03; was planned as `/play`) (full-screen kid mode, no browser-like navigation), `/parent`, `/admin`.
- `src/proxy.ts` refreshes the Supabase session and redirects unauthenticated users away from `/student/*` (except Welcome) and `/parent/*` (`/admin/*` when it exists). Pages and Server Functions check again; RLS is the real boundary.
- Kid mode is **entered by a signed-in guardian** on the device; the selected child is held in an httpOnly cookie (`little_child`) whose value is validated server-side against the guardian's family on every request.
- Leaving kid mode (to `/parent`, settings, or any external link) requires the **parent gate** component.
- Admin routes additionally check staff role in the layout (server) — never only in the client.

### 3.3 Component architecture

- **Server Components by default**; data fetching in server components/`features/*/server` modules.
- **Client Components only for interaction**: question renderers, drag & drop, audio, animations.
- **Question renderer registry**: `questionType → { schema (Zod), Renderer, Editor }`. Adding a question type = one schema + one renderer + one admin editor, nothing else.
- Kid components enforce constraints by API: e.g. `BigChoice` has a minimum size, `AudioPrompt` requires an audio source or explicit TTS text.
- Design tokens consumed only through Tailwind theme classes / CSS variables, never raw hex in components.

### 3.4 Data & API strategy

| Operation | Mechanism |
|-----------|-----------|
| Reads of published content | Server Components → Supabase (RLS: published only) |
| Parent/admin mutations | **Server Actions** with Zod validation → Supabase as the signed-in user (RLS enforced) |
| Answer submission | Server Action → Postgres function `submit_attempt(session_id, question_slug, response jsonb, idempotency_key)` (`security definer`) which grades against the private key, writes the attempt, updates mastery/progress/rewards, returns `AttemptResult` (API_CONTRACT.md) |
| Session lifecycle | RPCs `start_session(child_id, lesson_id)` / `finish_session(session_id)` |
| Media | Public bucket via CDN URLs for published media; signed URLs for drafts |
| Background/privileged jobs | Route handlers using the **service-role client**, server-only (`import 'server-only'`) |

No separate REST API layer in v1; route handlers exist only for things server actions can't do (webhooks, streaming, signed URLs for client-side fetches).

**Retry safety (implemented):** each try has an idempotency key reused on network retry; `submit_attempt` is idempotent on `(session_id, idempotency_key)` and unique on `(session_id, question_id, attempt_no)`. **Offline queue (planned, not implemented):** a persistent client queue of pending attempts.

## 4. Authentication & authorization

### 4.1 Identities

| Actor | Has auth user? | How identified |
|-------|----------------|----------------|
| Guardian | Yes (Supabase Auth) | `auth.uid()` → `profiles` → `family_members` |
| Child | **No** | Row in `children`; acts only through a guardian session on the device |
| Content editor / Admin | Yes | `staff_roles` (`editor`, `admin`) |

Rationale: children 5–6 cannot manage credentials; guardian-owned sessions keep consent and accountability with the adult (D-003).

### 4.2 Authorization model

- **RLS on every table**, default deny.
- Helper SQL functions (`security definer`, `stable`, fixed `search_path`):
  - `is_family_member(family_id)` — current user is a guardian in that family.
  - `can_access_child(child_id)` — via the child's family.
  - `is_staff()`, `has_staff_role(role)`.
- Content tables: `select` for everyone authenticated **where `status = 'published'`**; full access for staff.
- Child-data tables (`learning_sessions`, `question_attempts`, `skill_mastery`, `child_rewards`, assessment results): guardians of that family can read; **writes only through RPCs**, never direct `insert`.
- Staff cannot read child data by default (separation of content ops from family data). Support access, if ever needed, goes through an audited function.

### 4.3 Private answer keys

- Questions are split: `public.questions` (prompt, options, media refs — safe to send) and `private.question_keys` (correct answer, acceptable variants, grading rules).
- The `private` schema is **not** in the PostgREST exposed schemas, so it has no API surface at all; access only from `security definer` functions and the service role.
- Options are shuffled server-side and referenced by opaque option IDs so correctness can't be inferred from order.
- After an attempt, the RPC returns only what feedback needs (correct/incorrect, and the correct option ID after the final try for the demonstration).

## 5. Storage

| Bucket | Access | Contents |
|--------|--------|----------|
| `content-public` | Public read | Published images, 3D renders, audio voiceovers, mascot animations |
| `content-drafts` | Staff only | Uploads not yet published |
| `family-exports` | Private, signed URLs, short TTL | Data-export files for guardians |

No user-generated child media (photos, voice recordings) in v1.

## 6. Environment configuration

`src/lib/env.ts` validates at boot with Zod and fails fast.

| Variable | Exposure | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key) | client | Anon/publishable key (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` (or secret key) | **server only** | Privileged jobs; never imported in client code |
| `NEXT_PUBLIC_SITE_URL` | client | Auth redirects |
| `SUPABASE_PROJECT_REF` | CI only | Type generation, migrations |

Committed: `.env.example` with names only. Ignored: `.env*.local`. CI secrets live in the hosting provider.

## 7. Technical risks

| ID | Risk | Impact | Mitigation |
|----|------|--------|------------|
| R1 | Prototype's Firebase RTDB is written without auth; anyone with the URL+family code can read/overwrite child names & DOBs, and DB rules must be permissive for it to work. | Child data exposure (live today, independent of little) | Owner should review Firebase rules now; no migration of that data into Supabase without guardian re-consent; retire sync when little launches. |
| R2 | Vietnamese TTS voices are missing on many iPads/desktops (prototype already silently skips). | Audio-first UX breaks | Pre-generated audio files per prompt; TTS only as fallback; audio coverage check in admin before publish. |
| R3 | iOS Safari audio autoplay restrictions. | First prompt silent | Unlock audio context on the first "Play" tap; preload per session. |
| R4 | "3D" visuals hurting iPad performance / bundle size. | Jank, slow LCP | Pre-rendered 3D stills/short loops (WebP/AVIF, Lottie or video), no realtime WebGL in v1 (D-005). |
| R5 | RLS mistakes leaking family data across families. | Severe | pgTAP tests per table in CI; helper functions; no direct child-data writes. |
| R6 | Version drift: latest TypeScript major may not be supported by Next.js tooling yet. | Build breakage | **Resolved in Sprint 01:** versions pinned together (D-014); Renovate later. |
| R7 | Local Supabase needs Docker. | Resolved in Sprint 04: the stack runs locally; hosted project still pending (P-1). | Apply migrations to a hosted dev project first (SUPABASE_SETUP §5). |
| R8 | Content volume & education quality (only 2 modules targeted for v1). | Thin product | Admin CMS early enough (Sprint 05) + content seeded from prototype generators. |
| R9 | Children's data compliance (Vietnam PDP rules). | Legal | Data minimisation, consent records, deletion flow; legal review before launch. |
| R10 | Kid-mode escape (child reaching parent settings/purchases). | Trust | Parent gate on every exit; no external links in kid area. |
