# little — Backend Architecture (Sprints 04–05)

> Implemented and verified on a local Supabase stack. Not yet deployed to a hosted project (see SUPABASE_SETUP.md).

## 1. Shape

```
Browser (iPad / desktop)
  │  HTML + RSC, Server Function POSTs. No Supabase client, no tokens in JS (httpOnly cookies)
  ▼
Next.js 16 (App Router, Cache Components)
  src/proxy.ts ............ refresh Supabase session (getClaims), gate /student & /parent
  Server Components ....... read as the signed-in guardian (RLS) inside <Suspense>
  Server Functions ........ Zod-validate, re-check user/child, call RPCs
  'use cache' ............. published content via a session-less client (shared, cached)
  ▼
Supabase
  Auth (email + password, confirmation, recovery)      PostgREST (public schema only)
  Postgres: RLS on every table · SECURITY DEFINER RPCs · private schema (keys, config)
  Storage: public-learning-assets, public-audio
```

## 2. Why this split (DECISIONS D-038)

- **Postgres RPCs own every rule that protects data or decides outcomes**: access checks, grading with private keys, attempt counting, idempotency, progression/unlocking, stars, rewards, mastery. One transaction per answer; nothing authoritative is computed in the browser.
- **Server Functions are thin**: validation, session/child pinning, mapping to UI types. They hold no secrets — the app has no service-role key.
- **No Edge Functions / Route Handlers** (except `/auth/callback`): one pattern, fewer moving parts. Edge Functions remain an option for webhooks/email later.

## 3. Code map

```
supabase/
  config.toml                     local stack config (auth policy, redirect URLs)
  migrations/                     5 versioned migrations (schema, security, engine, storage, parent experience)
  seed.sql                        GENERATED dev seed (demo library)
src/
  proxy.ts                        session refresh + route gate
  lib/supabase/
    config.ts                     env → {url,key}; httpOnly cookie options
    server.ts                     createSupabaseServerClient (user, RLS) · createSupabasePublicClient (content)
    database.types.ts             generated types (pnpm db:types)
  features/auth/                  actions (sign-up/in/out, reset), DAL (getSessionUser/requireUser), safe redirects, messages
  features/family/                queries (family, children, selected child), actions (family/child CRUD, select), schemas
  features/learning/backend/
    content.ts                    published catalogue & lessons ('use cache', tag learning-content)
    student.ts                    requireStudent, loadStudentView (overview + daily plan), sessions, results
    overview.ts                   Zod schemas for RPC JSON + mapping to the view model (unit-tested)
    actions.ts                    startLesson, submitAnswer, requestHint, markRewardsSeen
  features/learning/student-context.tsx   client context with the server-built StudentView (+ break reminder)
  features/parent/                report-model.ts (Zod + plain-language mapping) · report.ts (get_child_report, summaries)
  features/family/settings-actions.ts     family name, invitations, membership, export/deletion wrappers
  app/parent/settings/export/route.ts     JSON download of the family's data
  app/auth/* app/parent/* app/student/*   routes (data loaded inside Suspense)
test/db/                          RLS & engine tests (real local stack, signed-in users)
```

## 4. Request flows

**Student page** (`/student/home`): proxy refreshes cookie → static shell streams → inside `<Suspense>`: `requireUser` → `getSelectedChild` (cookie → RLS select) → `get_student_overview` + cached catalogue → `ensure_daily_plan` (home only) → `StudentProvider` → client screen. One RPC for all child progress (no N+1).

**Answer** (`submitAnswerAction`): Zod → user → selected child → `learning_sessions` row must belong to that child (RLS + filter) → `submit_attempt` (locks session, replays idempotency key, validates question position and response, grades with the private key, inserts attempt, updates mastery/session, finishes the session and grants rewards when the last question closes) → UI feedback. Network failure → the same idempotency key is retried.

**Lesson start**: intro button → `startLessonAction` → `start_session` (unlock rules, one open session) → redirect to `/play`, which only *reads* the open session (GET never creates data).

## 5. Data model

See DATABASE_SCHEMA.md. Highlights: content addressed by slugs, child data by UUID; keys in `private.question_answer_keys`; progress tables are written only by definer functions; `child_module_progress` is a `security_invoker` view.

## 6. Caching & performance

- Published content: `'use cache'` + `cacheLife("minutes")`, tag `learning-content` (publishing UI must `revalidateTag`). Same for every family, holds no session.
- Child data: per request, never shared caches.
- Indexes on every FK used for lookups (`children(family_id)`, `learning_sessions(child_id, started_at desc)`, `question_attempts(session_id)`, `question_attempts(child_id, skill_id, created_at desc)` for mastery, partial unique `learning_sessions(child_id, lesson_id) where in_progress`, etc.).
- Overview: one RPC; history capped (100 lessons + 50 badges). No Realtime (no requirement).

## 7. Storage design

Created now: `public-learning-assets`, `public-audio` (public read, editor write, MIME + size limits, path pattern). Designed, not created (no feature needs them yet):

| Bucket | Access | Path |
|---|---|---|
| `private-user-assets` | family members (`is_family_member(first path segment)`); signed URLs ≤ 10 min | `<family_id>/<uuid>.<ext>` |
| `private-assessment-assets` | staff only; served to sessions via signed URLs from an RPC/Server Function | `<assessment_slug>/<asset>` |

## 8. Environments & demo boundary

There is **no demo mode** in the app any more (D-046). Local development uses the local Supabase stack with the dev seed. Demo content files remain in `src/data/demo/` only as the seed source and test fixtures; a unit test fails if app code imports them.

## 9. Known limitations

- Not deployed; hosted-project steps documented but not executed.
- Supabase Auth rate limits only (no CAPTCHA).
- Consent withdrawal = deletion (no separate flow); invitations by one-time code only (no email).
- Offline answer queue (planned in the original roadmap): not implemented; a failed request shows a retry message.
- `notFound()` inside streamed pages returns HTTP 200 (D-037).
