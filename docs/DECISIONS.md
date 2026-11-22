# little — Decision Log

> Format: ID · date · status (Proposed / Approved / Superseded) · decision · rationale · consequences.
> All entries are **Proposed** until the product owner approves the Project Foundation.

### D-001 · 2026-11-22 · Proposed — Build little inside the existing `be-vui-hoc-tap` repo
Keep the prototype as reference in `legacy/`; build the new Next.js app at the repo root. *Why:* preserves history and validated content; avoids a second repo. *Consequence:* prototype file moves in Sprint 01; its Firebase sync remains as-is until retired.

### D-002 · 2026-11-22 · Proposed — Stack: Next.js App Router, TypeScript strict, Tailwind v4, Motion, Supabase (Auth/Postgres/Storage), Zod, pnpm
As specified by the product brief. Versions pinned together at install (Sprint 01) after verifying compatibility.

### D-003 · 2026-11-22 · Proposed — Children have no auth accounts
Guardians authenticate; kid mode runs inside the guardian's session with a server-validated selected-child cookie. *Why:* 5–6-year-olds can't manage credentials; keeps consent and accountability with adults; simpler RLS. *Consequence:* a device is "unlocked" by a guardian; parent gate protects exits.

### D-004 · 2026-11-22 · Proposed — Answer keys in a non-exposed `private` schema; grading in `security definer` RPCs
*Why:* clients can never fetch keys, even with a valid session. *Consequence:* all answer submission goes through `submit_attempt`; admin editors write keys through staff-only RPCs.

### D-005 · 2026-11-22 · Proposed — "3D" via pre-rendered assets, no realtime WebGL in v1
*Why:* iPad performance, battery, bundle size, faster art iteration. *Consequence:* no three.js dependency; art pipeline exports WebP/AVIF + short alpha animations.

### D-006 · 2026-11-22 · Proposed — Recorded/generated audio files are the primary voice; browser TTS only as fallback
*Why:* prototype shows Vietnamese TTS voices are often missing. *Consequence:* publishing requires `prompt_audio_id`; VO production is on the critical path for content.

### D-007 · 2026-11-22 · Proposed — v1 scope: age 5–6 only
The prototype covers grades 0–5 math and English. little v1 targets the "Chuẩn bị vào lớp 1" level only; grade-1+ content is not migrated. English vocabulary is a P1 module candidate.

### D-008 · 2026-11-22 · Proposed — Server Actions + RPCs, no custom REST API in v1
*Why:* fewer moving parts, RLS enforced as the signed-in user. Route handlers only for webhooks/signed URLs.

### D-009 · 2026-11-22 · Proposed — Simple weighted-accuracy mastery model in v1
Parameters in one SQL function; revisit BKT/IRT once real attempt data exists.

### D-010 · 2026-11-22 · Proposed — Child data minimisation
Nickname, avatar, birth month/year only; no photos, voice recordings, full DOB, or location. Consent recorded per guardian with versioned text. Legal review of Vietnam PDP compliance required before launch.

### D-011 · 2026-11-22 · Proposed — Typography switch to Nunito Sans
Prototype uses Baloo 2 + Be Vietnam Pro; brief specifies Nunito Sans (must load the `vietnamese` subset). Single family simplifies the system.

### D-012 · 2026-11-22 · Proposed — Retire prototype Firebase sync; no automatic data migration
*Why:* unauthenticated, code-based access model (risk R1). Families re-create profiles under consent in little. *Recommended now (outside this project):* owner reviews the Firebase RTDB security rules.

### D-013 · 2026-11-22 · Proposed — No school-admission claims
Parent-facing copy reports observations only. Any curriculum-alignment statement requires named education-expert review recorded here.

### D-014 · 2026-11-22 · Approved (Sprint 01) — Pinned versions
Next.js 16.4.6, React 19.3.0, TypeScript **5.9.3**, Tailwind 4.3.3 (Turbopack loader, as scaffolded by create-next-app 16.4.6), Motion 14.14.0, Zod 4.6.7, ESLint 9, Vitest 5.1.1, pnpm 10.28. TypeScript 7 (the native port) was not adopted because Next's type checking and editor plugin depend on the JS compiler API; revisit when Next documents support. Resolves risk R6.

### D-015 · 2026-11-22 · Approved (Sprint 01) — Cache Components + Partial Prefetching on
Kept the Next 16.4 scaffold defaults (`cacheComponents: true`, `partialPrefetching: true`). Data fetching is dynamic by default; caching is opted into with `use cache` from Sprint 03.

### D-016 · 2026-11-22 · Approved (Sprint 01, updated Sprint 02) — Parent-gate entry button uses the adult size
The lock button that opens the parent gate is an adult control inside the student experience, sized 48 px (≥ 44 px parent minimum; was 52 px in Sprint 01) and placed in a corner, so children are less likely to tap it. All child-facing targets stay ≥ 64 px.

### D-017 · 2026-11-22 · Approved (Sprint 01, palette superseded by D-020) — Only little's palette exists in Tailwind
`tokens.css` resets Tailwind's default colours (`--color-*: initial`), so components cannot use off-palette colours. Added -400/-600 "top face / edge" pairs for butter, mint, lilac, rose, peach, plus `cream-edge`.

### D-018 · 2026-11-22 · Approved (Sprint 01) — Sound effects are synthesized
Tap/correct/try-again/reward sounds are generated with Web Audio oscillators (no asset files, tiny, instantly available). "Try again" is a soft descending pair, never a buzzer. Can be swapped for recorded SFX later without API changes.

### D-019 · 2026-11-22 · Approved (Sprint 01) — Parent gate design
Instruction written as Vietnamese words (e.g. "năm mươi mốt"), never read aloud; six two-digit options including the reversed-digit distractor; a 1.5 s hold is required for every attempt; a wrong hold regenerates the challenge. Keyboard hold supported for desktop parents.

### D-020 · 2026-11-22 · Approved (Sprint 02) — New brand palette with accessibility adjustments
The Sprint 02 brief's palette (Primary Blue #72A9EC, Sunshine Yellow #FFD16A, Soft Coral #FF927C, Mint #8BD5B0, Lavender #B9A7EA, Warm Cream #FFF8EC) replaces the Sprint 01 palette. Adjustments, all contrast-tested in CI: Text Secondary #748094 → #5F6A7D; added `-strong` variants (≥ 4.5:1 on canvas, surface and own tint) for text/icons/links/focus; `border-strong` #868E9C for control borders; text on fills is always Ink. Details: DESIGN_SYSTEM.md §3.

### D-021 · 2026-11-22 · Approved (Sprint 02) — Token scales replace Sprint 01 values
Type scale Display 36 → Caption 12 (Display/H1/H2 fluid on small screens); radius 12/16/24/32/pill (was 12/20/28/40); shadows xs/sm/md/lg; breakpoints `tablet` 640 / `desktop` 1024 / `wide` 1440 (Tailwind defaults removed). The 3D edge is kept but shortened to 2–4 px.

### D-022 · 2026-11-22 · Approved (Sprint 02) — Component naming and folders
Foundation components use the `Little*` prefix (`LittleButton`, `LittleCard`…); folders `components/{ui,navigation,layout,learning,parent,admin}`; tokens/motion in `src/design-system/`, art in `src/illustrations/`. Sprint 01 components were replaced, not duplicated (Button3D → LittleButton, BigChoice → AnswerOption, ProgressPath → LearningProgress, StarBurst → RewardPanel, KidShell → StudentShell, Mascot → LittleMascot, AudioPromptButton → AudioPlayer).

### D-023 · 2026-11-22 · Approved (Sprint 02) — Lucide for functional icons only
`lucide-react` added. Learning visuals always come from the illustration registry (`LittleIllustration`), never icons or emoji.

### D-024 · 2026-11-22 · Approved (Sprint 02) — Illustration registry with replaceable placeholders
Art is referenced by name (`{category}.{kebab-name}`); placeholder SVGs are marked `data-placeholder` until real files are registered. Real 3D assets replace them without component changes.

### D-025 · 2026-11-22 · Approved (Sprint 02) — No constant motion
Mascot idle is still; ray rotation, idle bob and progress pulsing from Sprint 01 were removed. Only state indicators loop (audio-playing ring, loading spinner).

### D-026 · 2026-11-22 · Approved (Sprint 02) — Tap-first activities; drag deferred
Sequence, pattern, matching and memory activities work by tapping (WCAG 2.5.7). `DragDropContainer` is deferred as an optional enhancement.

### D-027 · 2026-11-22 · Approved (Sprint 02) — Showcase route `/design-system`
Moved from `/dev/design-system`. Still hidden in production unless `ENABLE_DESIGN_SYSTEM=true` at build time.

### D-028 · 2026-11-22 · Recorded (Sprint 02) — Audience statement vs. D-013
The Sprint 02 brief describes children "preparing for Grade 1 and private school entrance assessments". This is recorded as audience context only. D-013 still applies: no admission requirements, readiness claims or school-specific content are designed or implied until requirements are sourced and approved by the product owner and an education reviewer.

### D-029 · 2026-11-22 · Approved (Sprint 03) — Student routes under `/student`
The brief's `/student/*` routes replace the planned `/play` area (never built), so there is one student route tree. ARCHITECTURE updated.

### D-030 · 2026-11-22 · Approved (Sprint 03) — Six question types
`single_choice`, `image_choice`, `matching`, `ordering`, `pattern`, `memory` replace the earlier planned enum (tap_choice, listen_choose, count_tap, drag_match, sort_order, odd_one_out). Mapping: tap_choice/listen_choose/odd_one_out → image_choice or single_choice; count_tap → single_choice with a counting stimulus; drag_match → matching (tap-to-match); sort_order → ordering. Config is a typed union per type.

### D-031 · 2026-11-22 · Approved (Sprint 03) — Progression rules
Within a skill, lessons open in order (difficulty progression). All worlds are open except Challenge Arena (mixed review), which opens after 3 completed lessons. Rules are data/pure functions so they can be tuned.

### D-032 · 2026-11-22 · Approved (Sprint 03) — Effort-based stars and badges
Stars: 1 for finishing, +1 if at least half were right first time, +1 if all were. Best result kept. Badges reward completion and exploration, never scores. No streaks, no leaderboards, no penalties for missed days.

### D-033 · 2026-11-22 · Approved (Sprint 03) — Grading in a Server Action with server-only demo keys
Even in the demo, keys live in an `import "server-only"` module and grading runs on the server, so keys never reach the device. Verified on the production build. In Sprint 04 this becomes the `submit_attempt` RPC.

### D-034 · 2026-11-22 · Approved (Sprint 03) — Device-local demo store
Profiles (demo family) and progress live in `localStorage` (`little.demo.v1`), validated with Zod, clearly labelled demo, never presented as secure or synced. Replaced by Supabase in Sprint 04.

### D-035 · 2026-11-22 · Approved (Sprint 03) — Learning-content colours
`--content-*` tokens (red, blue, yellow, green, orange, purple, brown) exist only for illustrations that teach colours/objects. They are not UI colours.

### D-036 · 2026-11-22 · Approved (Sprint 03) — One-time background motion on Welcome
The brief asked for a subtle animated background; to respect D-025 (no constant motion) clouds drift in once and stop. Disabled under reduced motion.

### D-037 · 2026-11-22 · Recorded (Sprint 03) — 404 status under Partial Prerendering
Unknown world/lesson ids render the student "lost" page with `noindex`, but the HTTP status is 200 because the static shell streams first (Next.js 16 behaviour). Acceptable for a child UI; revisit if SEO/monitoring needs real 404s.

### D-038 · 2026-11-22 · Approved (Sprint 04) — Business rules in Postgres RPCs; thin Server Functions; no service-role key in the app
Grading, attempts, idempotency, progression, stars, rewards and mastery are SECURITY DEFINER RPCs (one transaction per answer). Next.js Server Functions only validate, re-check the user/selected child and call RPCs as the signed-in guardian. No Edge Functions; no Route Handlers except `/auth/callback`. The web runtime has no service-role key.

### D-039 · 2026-11-22 · Approved (Sprint 04) — Parent auth: email + password with confirmation, httpOnly cookie sessions
Supabase Auth via `@supabase/ssr`; cookies are httpOnly because no browser Supabase client exists; `src/proxy.ts` refreshes sessions with `getClaims()`. Password ≥ 8 with letters and digits. Magic links are not offered in Sprint 04 (one sign-in method to support). Children never have credentials.

### D-040 · 2026-11-22 · Approved (Sprint 04) — Reveal after the last try
When a question closes wrong, the response includes the correct answer for that question only (the Sprint 03 learning design: show, then move on). Nothing is revealed before the question is closed.

### D-041 · 2026-11-22 · Approved (Sprint 04) — Scoring and memory validation
Each answer reports `score/maxScore` (pairs, positions or blanks right); it counts as correct only when complete. Memory submits the finished board's pairs, validated against private pairs; `pairKey` stays on the device because the cards' faces reveal it anyway.

### D-042 · 2026-11-22 · Approved (Sprint 04) — Mastery v1
States not_started / learning / practicing / mastered / review. Mastered needs ≥ 80 % first-try accuracy, ≥ 10 first attempts, ≥ 2 sessions, ≥ 4 distinct questions within 60 days; losing it moves a skill to review. Thresholds in `private.mastery_config`. Replaces the earlier EWMA sketch (D-009 still allows a richer model later).

### D-043 · 2026-11-22 · Approved (Sprint 04) — Family rules
One owned family per account; consent recorded on creation (`guardian_consents`, version `2026-11`); up to 6 active children per family; children are archived, not deleted. Guardian invitations: schema ready (`membership_status = invited`), flow not implemented.

### D-044 · 2026-11-22 · Approved (Sprint 04) — Published content is public and cached
Published modules/lessons/questions/rewards are readable with the publishable key (they contain no keys), read with a session-less client and cached (`'use cache'`, minutes). Drafts are staff-only.

### D-045 · 2026-11-22 · Approved (Sprint 04) — "Today" uses Asia/Ho_Chi_Minh
Daily plan, stars-today and greetings use Vietnam time computed on the server (avoids hydration mismatches and server-UTC drift). Revisit with per-family time zones if the product leaves Vietnam.

### D-046 · 2026-11-22 · Approved (Sprint 04) — Demo store removed; demo content becomes the dev seed
The device-local demo (D-034) is retired: no demo mode in the app. The Sprint 03 library is the development seed, generated from the TypeScript source (`supabase/seed.sql`, checked by a test). App code must not import `src/data/demo` (tested).

### D-047 · 2026-11-22 · Approved (Sprint 04) — Tables not created
No `question_options` (options belong to each question's typed public config), no `learning_paths` (path = module → skill → lesson order + unlock rules), `child_module_progress` is a view. Revisit when a feature needs per-option analytics or personalised paths.

### D-048 · 2026-11-22 · Approved (Sprint 04) — Staff roles separate from family roles
`staff_roles` (content_editor, content_reviewer, publisher, admin) vs family roles (owner = parent, guardian). Admin implies all staff permissions; first admin bootstrapped by SQL. Staff cannot read child data.

### D-049 · 2026-11-22 · Approved (Sprint 04) — Selected child in an httpOnly cookie
`little_child` names the active child; it is re-validated under RLS on every request and learning actions pin sessions to it. Changing the cookie to another family's child id has no effect (tested).

## Pending decisions

| ID | Question | Owner |
|----|----------|-------|
| P-1 | Supabase region & hosting provider confirmation; hosted project + SMTP provider for auth emails (blocks remote migration) | Product owner |
| P-2 | Voiceover source (voice actor vs. AI voice with licence) | Product owner |
| P-3 | Mascot cast & art vendor | Product / Design |
| P-4 | Education reviewer for skill taxonomy | Product owner |
| P-5 | Monetisation timing | Product owner |
| P-6 | English parent UI in v1 or P1 | Product owner |
| P-7 | Which of the 7 learning worlds ship in v1 (D-007 limits v1 to age 5–6; English Island was P1) | Product owner + education reviewer |
| P-8 | Naming review for "IQ Castle" — "IQ" can imply IQ testing to parents; working Vietnamese name "Lâu Đài Tư Duy" | Product owner |
| P-9 | Scope and sources for "private school entrance assessment" preparation (see D-028) | Product owner + education reviewer |
