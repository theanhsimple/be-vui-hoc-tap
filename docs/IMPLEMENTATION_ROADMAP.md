# little — Implementation Roadmap

> **Status:** Sprints 00–03 complete (03 = demo, device-local progress). Sprints 04–06 planned, not started. Each sprint needs explicit approval before work begins.
>
> **Re-sequenced in Sprint 02:** the product owner inserted a dedicated "Design System & Visual Foundation" sprint as Sprint 02. The former Sprints 02–05 move to 03–06 with unchanged content (Sprint 03 now builds on the Sprint 02 component library).

Sprint length assumption: ~2 weeks each. Order is chosen so the riskiest UX (kid audio-first interaction) is validated early with static data before the backend is built around it.

---

## Sprint 00 — Project Foundation ✅

- Repository audit, PRD, architecture, UX/UI spec, database plan, decisions log, roadmap (`/docs`).
- No code, no packages, no migrations.

---

## Sprint 01 — Foundation & Design System v0 ✅ (visual layer superseded by Sprint 02)

**Result (2026-11-22)**

| Acceptance criterion | Status |
|---|---|
| `pnpm build` passes, zero TS errors (strict), lint clean | ✅ |
| Design-system page renders at iPad landscape/portrait and desktop | ✅ in Chromium with iPad Pro 11 emulation (Playwright); **real iPad Safari not yet tested** |
| Kid components ≥ 64 px | ✅ unit tests for BigChoice sizes + Playwright measurement of 29 kid targets. The parent-gate entry button (52 px) is deliberately an adult control (D-016) |
| Reduced motion disables movement | ✅ verified with Playwright `reducedMotion: 'reduce'` (mascot transform static) |
| Audio plays after first tap on iPad Safari; replay works | ⚠️ Engine unit-tested (unlock, preload, interrupt, TTS fallback, mute, SFX) and unlock verified in Chromium. **Needs a manual check on a real iPad** — not possible from the dev container |
| Legacy prototype still opens | ✅ moved to `legacy/prototype.html`, unchanged |

Not done in Sprint 01 by design: no real audio files (none exist yet), no final mascot art, no Supabase code.


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

## Sprint 02 — Design System & Visual Foundation ✅ (implemented, awaiting review)

**Delivered:** new palette & tokens (contrast-tested), typography, spacing/radius/elevation, breakpoints, motion presets, illustration registry with placeholders, 7-world visual direction, ~45 components (`ui`, `navigation`, `layout`, `learning`, `parent`, `admin`), `/design-system` showcase with a working representative activity, `docs/DESIGN_SYSTEM.md`.

| Definition of done | Status |
|---|---|
| Tokens, typography, global styles, components, types, states, motion | ✅ |
| Responsive behaviour validated | ✅ Chromium at 1180×820, 820×1180, 1440×900, 390×844 (touch emulation); no overflow, clean console. **Physical iPad not tested.** |
| Accessibility basics | ✅ contrast tests, keyboard/focus/modal-trap checks, reduced motion, labelled controls |
| Showcase functional | ✅ |
| Docs updated | ✅ |
| TypeScript, lint, tests, build | ✅ |
| Known limitations documented | ✅ DESIGN_SYSTEM.md §15 |

---

## Sprint 03 — Student Learning Experience ✅ (implemented as demo, awaiting review)

**Delivered:** all 9 student screens under `/student/*`, reusable activity player with 6 question types, server-side grading with server-only keys, 84-question demo library (7 worlds, 28 lessons), progress/stars/badges/daily plan, device-local demo store with resume after refresh. Details: [`LEARNING_ENGINE.md`](LEARNING_ENGINE.md).

| Definition of done | Status |
|---|---|
| Welcome, profiles, home, explore, 7 worlds, module detail, lesson intro | ✅ tested (Playwright, production build) |
| Activity player, 6 question types, correct/incorrect feedback, retry, hint, exit | ✅ unit + integration + browser tested |
| Result, rewards, reward calculation | ✅ unit + browser tested |
| Demo content (84 q) + answer verification | ✅ automated structural + semantic checks |
| Progress calculation, session persistence, refresh/resume | ✅ |
| All routes connected (Welcome → … → Rewards → Home) | ✅ full touch flow on iPad-sized viewport |
| Responsive (1180×820, 820×1180, 1440×900, 390×844) | ✅ in Chromium; physical iPad not tested |
| TypeScript, lint, tests, build | ✅ |
| Known limitations documented | ✅ LEARNING_ENGINE.md §10 |

---

## Sprint 03 (original plan, superseded above) — Student Learning Experience (static content)

**Deliverables**
1. Kid routes: Welcome, Profile selection, Home, Explore World, Module detail, Learning session, Rewards — wired to a **typed local content fixture** (clearly labelled fixture, replaced in Sprint 03; not presented as real backend functionality).
2. Question renderers built on Sprint 02 components: `tap_choice`, `listen_choose`, `count_tap`, `drag_match` (tap-to-match), `sort_order`, `odd_one_out`.
3. Session flow: 2 tries → demonstration, gentle feedback, celebration, progress path.
4. Content for one module ("Number Garden") ported from the prototype's grade-0 math games, with placeholder audio.
5. Playwright e2e on iPad viewport for a full session.

**Dependencies:** Sprint 01 audio module and Sprint 02 component library (QuestionCard, ImageChoice, AnswerOption, activities, FeedbackPanel, RewardPanel, StudentShell).

**Acceptance criteria**
- A child-testing session (or internal proxy) completes a lesson on iPad with no reading required.
- No route in `/play` links outside kid mode without `ParentGate`.
- Lighthouse (mobile) performance ≥ 85 on session screen; interaction feedback < 100 ms.
- Question payload schemas validated by Zod; renderers have unit tests.

---

## Sprint 04 — Backend Integration & Learning Engine ✅ (implemented on a local stack, awaiting review)

**Delivered:** Supabase schema (4 migrations), RLS on every table, server-side grading and learning engine RPCs, parent auth (register, confirm, login, logout, reset), family + child management, student routes on real data, dev seed with all 84 questions, 41 DB security/engine tests, browser end-to-end flow. Details: [`BACKEND_ARCHITECTURE.md`](BACKEND_ARCHITECTURE.md), [`SECURITY_AND_RLS.md`](SECURITY_AND_RLS.md), [`API_CONTRACT.md`](API_CONTRACT.md), [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md).

| Definition of done | Status |
|---|---|
| Supabase integration configured | ✅ local stack; hosted project ❌ (no credentials, P-1) |
| Parent auth, session management | ✅ tested in browser (register → email confirm → login → logout → reset) |
| Family creation & membership, child management | ✅ tested (DB + browser); guardian invitations not implemented |
| Migrations created / applied | ✅ created · ✅ applied locally · ❌ not applied remotely |
| Seed data migrated | ✅ 7 modules, 14 skills, 28 lessons, 84 questions, 84 keys, 6 rewards (verified counts) |
| RLS + multi-family isolation tests | ✅ 41/41 pass on the local stack |
| Private keys protected, server-side grading | ✅ DB tests + browser network scan + build scan |
| Sessions persist, duplicates prevented | ✅ |
| Skill mastery, rewards persisted | ✅ |
| Student routes use backend data; error/loading states | ✅ |
| Env documentation; typecheck, lint, build | ✅ |
| Security limitations documented | ✅ SECURITY_AND_RLS §9 |

Deferred from the original Sprint 04 plan: offline attempt queue, magic-link sign-in, pgTAP (replaced by API-level tests as real users), CI pipeline for DB tests.

---

## Sprint 05 — Parent Dashboard & Assessment ✅ (implemented on a local stack, awaiting review)

| Deliverable / criterion | Status |
|---|---|
| Onboarding hand-off (family → consent → first child → placement intro) | ✅ browser-tested |
| Child profiles: edit, archive, **restore**, **permanent delete** (owner) | ✅ DB + browser tested (birth *year* only, by design D-043) |
| Placement activity (parent intro → child activity → parent summary) | ✅ DB + browser tested; item choice pending education review |
| Progress view (time estimate, days, lessons, stars, worlds, recent activity) + skill bands with at-home ideas | ✅ browser-tested; texts are drafts (P-4) |
| Settings: break reminder per child | ✅ browser-tested (reminder, gate, waits during lessons) |
| Settings: data export, family deletion, account deletion | ✅ DB-verified deletion by owner-level counts; export browser-tested |
| Second guardian (one-time code) | ✅ DB + browser tested |
| Privacy text placeholder flagged pending legal review | ✅ `/privacy` draft + link from consent |
| Music / captions settings | ⬜ not started (no background music exists; spoken prompts are already shown as text) |
| Parent UI language vi/en | ⬜ not started (P-6 pending) |
| "≤ 5 minutes signup to play" moderated test | ⬜ needs real parents |
| axe zero serious/critical | ✅ on the 9 Sprint 05 routes at 375 px and 1180 px (automated only; no manual screen-reader pass) |

**Deliverables (original plan)**
1. Parent auth screens, onboarding wizard (family → consent → child → assessment hand-off).
2. Child profiles CRUD (nickname, avatar, birth month/year), archive.
3. Initial placement assessment flow (parent intro → kid activity → parent summary).
4. Progress view (sessions, time, modules, timeline) and Skill analysis (mastery bands + home activities).
5. Settings: session limit + break reminder, music, captions, language, data export, account/family deletion; second-guardian invite (P1 if time).
6. Privacy policy + consent text placeholders flagged **"pending legal review"**.

**Dependencies:** Sprint 04 data and RPCs; education reviewer for skill descriptions; legal reviewer for consent copy.

**Acceptance criteria**
- New parent goes from signup to child playing in ≤ 5 minutes (moderated test).
- Assessment produces per-skill observations; copy contains no grades, rankings, or school-admission claims.
- Export returns all of the family's data; deletion removes it (verified by query).
- Parent UI meets WCAG 2.2 AA (axe: zero serious/critical issues).

---

## Release — Device edition on GitHub Pages ✅ (built and browser-tested locally; deployment needs the Pages setting)

Static build of the same app for GitHub Pages; learning engine runs on the device (D-056). Deploy guide: [`DEPLOY_GITHUB_PAGES.md`](DEPLOY_GITHUB_PAGES.md). Verified: engine unit tests (all 84 questions, unlocking, stars, rewards, mastery, placement, deletion); browser flow on the `/be-vui-hoc-tap` base path (parent gate, profile, placement, lessons, resume after refresh, persistence across tabs, report, break reminder, backup/erase/restore, archive/delete; no external requests, no console errors); 15 routes × 4 viewports, axe 0 serious/critical. Not done: offline service worker, sync between devices, real iPad/Safari test.

## Sprint 06 — Admin CMS & Production QA

**Deliverables**
1. Admin shell with staff-role guard; Modules, Skills, Question Bank (typed editors per question type incl. private key entry), Lesson Builder (ordering, preview as child), Assessment Builder, Media Library (upload, tag, search), Staff & roles, audit log.
2. Publish workflow with completeness checks (audio, alt text, key present).
3. Second module authored entirely through the CMS.
4. Production hardening: error monitoring, rate limiting on auth, security headers/CSP, backups confirmed, performance budgets.
5. QA pass: device matrix (iPad 9th gen+, iPad Air/Pro, desktop Chrome/Safari/Edge), accessibility, RLS penetration checklist, content review sign-off.

**Dependencies:** Sprints 04–05; content team availability; production Supabase + hosting accounts.

**Acceptance criteria**
- A non-engineer creates, previews and publishes a lesson end-to-end.
- Non-staff users receive 403/redirect for every `/admin` route and every staff RPC.
- Release checklist complete: all P0 PRD items demonstrably working on the device matrix; zero open critical/high bugs; legal + education reviews recorded in `DECISIONS.md`.

---

## Cross-sprint dependencies

```
S01 scaffold/audio ─> S02 design system ─┬─> S03 student screens ──> S04 wire to DB ─┬─> S05 parent
                                         └──────────────────────────> S04 auth ───────┴─> S06 admin + QA
```

External inputs needed: Supabase project(s), hosting account, mascot/3D art direction, Vietnamese voiceover, education reviewer, legal reviewer.
