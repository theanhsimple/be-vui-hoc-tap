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

### D-016 · 2026-11-22 · Approved (Sprint 01) — Parent-gate entry button uses the adult size
The lock button that opens the parent gate is an adult control inside kid mode, sized 52 px (≥ 44 px parent minimum) and placed in a corner, so children are less likely to tap it. All child-facing targets stay ≥ 64 px.

### D-017 · 2026-11-22 · Approved (Sprint 01) — Only little's palette exists in Tailwind
`tokens.css` resets Tailwind's default colours (`--color-*: initial`), so components cannot use off-palette colours. Added -400/-600 "top face / edge" pairs for butter, mint, lilac, rose, peach, plus `cream-edge`.

### D-018 · 2026-11-22 · Approved (Sprint 01) — Sound effects are synthesized
Tap/correct/try-again/reward sounds are generated with Web Audio oscillators (no asset files, tiny, instantly available). "Try again" is a soft descending pair, never a buzzer. Can be swapped for recorded SFX later without API changes.

### D-019 · 2026-11-22 · Approved (Sprint 01) — Parent gate design
Instruction written as Vietnamese words (e.g. "năm mươi mốt"), never read aloud; six two-digit options including the reversed-digit distractor; a 1.5 s hold is required for every attempt; a wrong hold regenerates the challenge. Keyboard hold supported for desktop parents.

## Pending decisions

| ID | Question | Owner |
|----|----------|-------|
| P-1 | Supabase region & hosting provider confirmation | Product owner |
| P-2 | Voiceover source (voice actor vs. AI voice with licence) | Product owner |
| P-3 | Mascot cast & art vendor | Product / Design |
| P-4 | Education reviewer for skill taxonomy | Product owner |
| P-5 | Monetisation timing | Product owner |
| P-6 | English parent UI in v1 or P1 | Product owner |
