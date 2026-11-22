# little — Implementation Roadmap

> **Status:** Sprint 00 (Project Foundation) complete — documentation only. Sprints 01–05 are planned, not started. Each sprint needs explicit approval before work begins.

Sprint length assumption: ~2 weeks each. Order is chosen so the riskiest UX (kid audio-first interaction) is validated early with static data before the backend is built around it.

---

## Sprint 00 — Project Foundation ✅

- Repository audit, PRD, architecture, UX/UI spec, database plan, decisions log, roadmap (`/docs`).
- No code, no packages, no migrations.

---

## Sprint 01 — Foundation & Design System

**Deliverables**
1. Move prototype `index.html` → `legacy/prototype.html` (kept runnable).
2. Next.js App Router + TypeScript strict + Tailwind v4 + Motion + Zod scaffold with pnpm; ESLint, Prettier, `tsconfig` strict flags.
3. `src/lib/env.ts` (Zod env), `.env.example`, `.gitignore`.
4. Design tokens (`tokens.css`) and Nunito Sans (vi subset) from `UX_UI_SPECIFICATION.md`.
5. Core components: `Button3D`, `Card`, `SpeechBubble`, `AudioPromptButton`, `Mascot` (placeholder art), `BigChoice`, `ProgressPath`, `ParentGate`, `KidShell`, `ParentShell`, `AdminShell`.
6. Audio module: unlock-on-first-tap, preload, queue, replay, TTS fallback.
7. Internal `/dev/design-system` page showing all components and states (dev-only route).
8. CI: typecheck, lint, unit tests (Vitest) on push.

**Dependencies:** approval of this foundation; final pick of mascot placeholder art.

**Acceptance criteria**
- `pnpm build` passes with zero TS errors in strict mode; lint clean.
- Design-system page renders on iPad Safari (landscape & portrait) and desktop Chrome.
- All kid components ≥ 64 px targets (verified by a unit test on rendered sizes or Playwright check).
- Reduced-motion disables movement animations.
- Audio plays after first tap on iPad Safari; replay works.
- Legacy prototype still opens and works from `legacy/`.

---

## Sprint 02 — Student Learning Experience (static content)

**Deliverables**
1. Kid routes: Welcome, Profile selection, Home, Explore World, Module detail, Learning session, Rewards — wired to a **typed local content fixture** (clearly labelled fixture, replaced in Sprint 03; not presented as real backend functionality).
2. Question renderers: `tap_choice`, `listen_choose`, `count_tap`, `drag_match`, `sort_order`, `odd_one_out`, each with idle/selected/correct/try-again/demonstrate states.
3. Session flow: 2 tries → demonstration, gentle feedback, celebration, progress path.
4. Content for one module ("Number Garden") ported from the prototype's grade-0 math games, with placeholder audio.
5. Playwright e2e on iPad viewport for a full session.

**Dependencies:** Sprint 01 components and audio module.

**Acceptance criteria**
- A child-testing session (or internal proxy) completes a lesson on iPad with no reading required.
- No route in `/play` links outside kid mode without `ParentGate`.
- Lighthouse (mobile) performance ≥ 85 on session screen; interaction feedback < 100 ms.
- Question payload schemas validated by Zod; renderers have unit tests.

---

## Sprint 03 — Backend & Learning Engine

**Deliverables**
1. Supabase project (dev) + `supabase/` config; migrations for all tables in `DATABASE_SCHEMA.md`; generated types.
2. RLS policies + helper functions; `private.question_keys`.
3. RPCs: `create_family`, `start_session`, `submit_attempt`, `finish_session`; mastery update.
4. Supabase Auth (email+password, magic link) with `@supabase/ssr`, middleware, guards.
5. Storage buckets + policies; Number Garden content seeded into DB (dev seed only).
6. Kid experience switched from fixture to DB; offline attempt queue + idempotent submit.
7. pgTAP RLS test suite in CI.

**Dependencies:** Supabase project credentials (provided by owner via environment secrets, never committed); Sprint 02 renderers.

**Acceptance criteria**
- All pgTAP tests pass: cross-family isolation, no anon access, staff cannot read child data, keys unreachable via PostgREST.
- Network inspection of a full session shows **no answer keys** in any response before submission.
- Attempts, sessions, mastery persisted and correct after network drop/reconnect.
- Migrations apply cleanly to an empty database; no destructive statements.

---

## Sprint 04 — Parent Dashboard & Assessment

**Deliverables**
1. Parent auth screens, onboarding wizard (family → consent → child → assessment hand-off).
2. Child profiles CRUD (nickname, avatar, birth month/year), archive.
3. Initial placement assessment flow (parent intro → kid activity → parent summary).
4. Progress view (sessions, time, modules, timeline) and Skill analysis (mastery bands + home activities).
5. Settings: session limit + break reminder, music, captions, language, data export, account/family deletion; second-guardian invite (P1 if time).
6. Privacy policy + consent text placeholders flagged **"pending legal review"**.

**Dependencies:** Sprint 03 data and RPCs; education reviewer for skill descriptions; legal reviewer for consent copy.

**Acceptance criteria**
- New parent goes from signup to child playing in ≤ 5 minutes (moderated test).
- Assessment produces per-skill observations; copy contains no grades, rankings, or school-admission claims.
- Export returns all of the family's data; deletion removes it (verified by query).
- Parent UI meets WCAG 2.2 AA (axe: zero serious/critical issues).

---

## Sprint 05 — Admin CMS & Production QA

**Deliverables**
1. Admin shell with staff-role guard; Modules, Skills, Question Bank (typed editors per question type incl. private key entry), Lesson Builder (ordering, preview as child), Assessment Builder, Media Library (upload, tag, search), Staff & roles, audit log.
2. Publish workflow with completeness checks (audio, alt text, key present).
3. Second module authored entirely through the CMS.
4. Production hardening: error monitoring, rate limiting on auth, security headers/CSP, backups confirmed, performance budgets.
5. QA pass: device matrix (iPad 9th gen+, iPad Air/Pro, desktop Chrome/Safari/Edge), accessibility, RLS penetration checklist, content review sign-off.

**Dependencies:** Sprints 03–04; content team availability; production Supabase + hosting accounts.

**Acceptance criteria**
- A non-engineer creates, previews and publishes a lesson end-to-end.
- Non-staff users receive 403/redirect for every `/admin` route and every staff RPC.
- Release checklist complete: all P0 PRD items demonstrably working on the device matrix; zero open critical/high bugs; legal + education reviews recorded in `DECISIONS.md`.

---

## Cross-sprint dependencies

```
S01 tokens/components/audio ─┬─> S02 kid screens ──> S03 wire to DB ─┬─> S04 parent
                             └──────────────────────> S03 auth ───────┴─> S05 admin + QA
```

External inputs needed: Supabase project(s), hosting account, mascot/3D art direction, Vietnamese voiceover, education reviewer, legal reviewer.
