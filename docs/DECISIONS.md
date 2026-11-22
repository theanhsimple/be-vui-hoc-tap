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

## Pending decisions

| ID | Question | Owner |
|----|----------|-------|
| P-1 | Supabase region & hosting provider confirmation | Product owner |
| P-2 | Voiceover source (voice actor vs. AI voice with licence) | Product owner |
| P-3 | Mascot cast & art vendor | Product / Design |
| P-4 | Education reviewer for skill taxonomy | Product owner |
| P-5 | Monetisation timing | Product owner |
| P-6 | English parent UI in v1 or P1 | Product owner |
