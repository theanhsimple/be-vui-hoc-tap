# little — Product Requirements Document

> **Status:** Draft v0.1 — Project Foundation (Sprint 00). Nothing in this document is implemented yet.
> **Concept:** Little Explorer World · **Tagline:** *A little step. A big discovery.*

---

## 1. Product summary

**little** is a premium, 3D-playful learning platform for children aged **5–6** in **Vietnam**, used on **iPad and desktop** together with their parents. Children explore a friendly world of themed "islands" (modules), complete short audio-guided learning sessions, and collect rewards. Parents set up the family, run an initial assessment, and follow progress and skill development. An internal content team manages all learning content through an admin CMS.

Because many children in this age group cannot yet read or write fluently, **the child experience is visual-first and audio-first**: every instruction is spoken, every choice is a picture or object, and no child-facing interaction requires reading or typing.

### 1.0 Audience note (Sprint 02)

The Sprint 02 brief describes the audience as children preparing for Grade 1 **and private school entrance assessments**. This is recorded as context only; no admission requirements or readiness claims are designed or implied (DECISIONS D-013, D-028, P-9).

### 1.1 Relationship to the existing prototype

The repository `be-vui-hoc-tap` already contains a working single-file prototype, **"Bé Vui Học Tập"** (`index.html`, vanilla JS, no build step). It is the validated starting point for little — not something to discard:

| Prototype has | little keeps / changes |
|---------------|------------------------|
| Child profiles (name, full DOB, grade 0–5, avatar) in `localStorage` | Profiles move to Supabase under a guardian account; DOB reduced to month/year; scope narrowed to age 5–6 ("Chuẩn bị vào lớp 1" level) for v1 |
| Math for grade 0: count, add, sub, compare, missing number (range 5/10/20) | Becomes the first content module ("Numbers & counting"), re-authored as CMS data |
| English vocabulary (Pre A1 Starters topics) with listen / word→picture games | Candidate P1 module; grade-1+ English and math are **out of scope for v1** |
| Mascot "Bạn Nắng", sticker tokens ("Phiếu bé ngoan"), parent-redeemed real-world gifts | Mascot concept and parent-confirmed real-world rewards are kept and redesigned in the 3D style |
| Browser TTS (`speechSynthesis`) — Vietnamese voice often missing on devices | Replaced by recorded/generated audio files in Supabase Storage; TTS only as fallback |
| Firebase RTDB sync via a shared "family code" with no authentication | **Retired.** Replaced by Supabase Auth + RLS. See risk R1 in `ARCHITECTURE.md` |

The prototype remains in the repo (moved to `legacy/` in Sprint 01) as a reference until the new student experience reaches parity for the 5–6 scope.

## 2. Goals

| # | Goal | Measure (to be instrumented, Sprint 03+) |
|---|------|-----------------------------------------|
| G1 | Children can use the app independently after parent setup | ≥ 90% of sessions completed without a parent-gate exit |
| G2 | Short, joyful, healthy sessions | Median session 6–12 min; break reminder respected |
| G3 | Parents understand their child's development | Parent dashboard weekly active rate |
| G4 | Content team ships lessons without engineers | Lesson created → published entirely in admin CMS |
| G5 | Child data is safe and private | Zero RLS policy test failures; no answer keys reachable from the client |

## 3. Non-goals (v1)

- No social features, chat, leaderboards between children, or public profiles.
- No advertising, no in-app purchases inside the child area.
- No claims of school admission readiness, certification, or official grading. **We do not invent or imply school admission requirements.** Any curriculum alignment statement (e.g. with the MOET preschool programme for the 5–6 age group) must be reviewed by a qualified early-childhood education expert before it is published.
- No realtime multiplayer, no live tutoring.
- No native app in v1 (responsive web, iPad Safari first; PWA install considered later).

## 4. Users & personas

| Persona | Description | Key needs |
|---------|-------------|-----------|
| **Child (Explorer)**, 5–6 | Pre-reader or early reader, Vietnamese-speaking, touch-native | Big targets, spoken instructions, instant friendly feedback, rewards, no failure shame |
| **Parent / Guardian** | Busy, mobile + desktop, Vietnamese (English optional) | Fast onboarding, clear progress, trust & privacy, screen-time control |
| **Content editor** (internal) | Educator / content designer | Build modules, skills, questions, lessons, assessments with media; preview as child |
| **Admin** (internal) | Platform operator | Manage staff roles, publish content, audit |

Business model: **multi-family public platform** — any family can sign up; each family's data is isolated from every other family.

## 5. Experiences & functional requirements

Priority: **P0** = required for first release, **P1** = soon after, **P2** = later.

### A. Student experience (route area `/student`)

> Sprint 03: S1–S9 implemented as a demo (device-local progress, demo voice, placeholder art). S10 break reminder not started. See LEARNING_ENGINE.md.

| ID | Screen | Requirement | Pri |
|----|--------|-------------|-----|
| S1 | Welcome | Animated mascot greeting with voiceover; single large "Play" button. | P0 |
| S2 | Profile selection | Child picks their own avatar (no names required to read — avatar + spoken name). | P0 |
| S3 | Home dashboard | Mascot, "continue" big card, today's suggested activity, sticker book entry. | P0 |
| S4 | Explore World | Map of themed islands (modules); locked/unlocked states shown visually; tap = spoken module name. | P0 |
| S5 | Module detail | Lessons shown as a path of stepping stones; stars earned per lesson. | P0 |
| S6 | Learning session | 5–8 interactive questions, audio instruction auto-plays, replay button always visible, progress shown as visual path (not numbers). | P0 |
| S7 | Interactive questions | Question types: tap-choice (image), listen-and-choose, count-and-tap, drag-to-match, sort/order, odd-one-out. Trace/draw = P2. | P0/P2 |
| S8 | Rewards | End-of-session celebration, stars, stickers for sticker book, explorer badges for milestones. | P0 |
| S9 | Parent gate | Any exit to parent area, settings, or external link is protected by an adult-only challenge that relies on reading (e.g. a written instruction such as "Nhấn giữ số bảy mươi hai" over a grid of numerals). It is never read aloud. | P0 |
| S10 | Break reminder | After a parent-configured time, mascot suggests a break; session ends gracefully. | P1 |

Feedback rules: wrong answers get gentle encouragement and a hint, never a buzzer or red "X"; after 2 incorrect tries the correct answer is demonstrated.

### B. Parent experience (route area `/parent`)

| ID | Screen | Requirement | Pri |
|----|--------|-------------|-----|
| P1 | Authentication | Email + password and email magic link (Supabase Auth). Social login (Google/Apple) P1. | P0 |
| P2 | Family onboarding | Create family, accept terms, **explicit guardian consent** for processing a child's data. | P0 |
| P3 | Child profiles | Add/edit/archive children: nickname, avatar, birth month/year (no full DOB, no photo). Max children per family configurable (default 4). | P0 |
| P4 | Initial assessment | Guided, parent-present, playful placement activity per child; results framed as *observations*, not scores or grades. | P0 |
| P5 | Learning progress | Sessions, time spent, modules completed, recent activity timeline. | P0 |
| P6 | Skill analysis | Per-skill mastery bands (Exploring → Developing → Confident), with suggested at-home activities. | P1 |
| P7 | Settings | Session time limit, sound/voice, language (vi/en for parent UI), data export & account deletion, invite a second guardian. | P0 (invite P1) |

### C. Admin experience (route area `/admin`)

| ID | Screen | Requirement | Pri |
|----|--------|-------------|-----|
| A1 | Content dashboard | Content status overview (draft / in review / published). | P0 |
| A2 | Modules | CRUD, ordering, cover art, theme colour, unlock rules. | P0 |
| A3 | Skills | Skill taxonomy (domain → skill), descriptions for parents. | P0 |
| A4 | Question Bank | Typed question editor validated by Zod per question type; answer key stored privately. | P0 |
| A5 | Lesson Builder | Compose lessons from questions, reorder, preview in child mode. | P0 |
| A6 | Assessment Builder | Build placement assessments mapped to skills. | P1 |
| A7 | Media Library | Upload images, audio (voiceover), 3D-rendered stills/animations; tag, search, reuse. | P0 |
| A8 | Staff & roles | Grant/revoke editor/admin roles; audit log. | P1 |

## 6. Learning content scope (initial)

**Learning worlds (visual framework, Sprint 02):** Alphabet Forest, Number Kingdom, IQ Castle, Memory Garden, English Island, School Town, Challenge Arena. Mapping of skill domains to worlds and the v1 subset are pending (DECISIONS P-7).


Initial skill domains (subject to education-expert review — names are working titles):

1. **Numbers & counting** (đếm, nhận biết số 0–10, so sánh nhiều/ít)
2. **Shapes & space** (hình dạng, vị trí trên/dưới/trong/ngoài)
3. **Patterns & logic** (quy luật, phân loại, tìm điểm khác)
4. **Sounds & letters** (pre-literacy: nghe âm, nhận diện chữ cái — no reading required)
5. **World around me** (động vật, màu sắc, thời tiết, cơ thể)
6. **Feelings & me** (nhận biết cảm xúc) — P1

## 7. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Devices | iPad (Safari, iPadOS 17+) first, landscape primary; desktop Chrome/Safari/Edge; portrait iPad supported. |
| Performance | Child screens: LCP < 2.5 s on iPad over 4G; interaction feedback < 100 ms; audio starts < 300 ms after screen ready (preloaded). |
| Accessibility | Touch targets ≥ 64 px (child), ≥ 44 px (parent/admin); WCAG 2.2 AA for parent/admin; reduced-motion support; captions available for voiceover. |
| Language | Child UI: Vietnamese voice + visuals. Parent UI: Vietnamese default, English P1. Admin: Vietnamese/English. |
| Privacy | Data minimisation for children; guardian consent; family data isolation via RLS; deletion on request. Compliance with Vietnam's personal-data protection rules (Decree 13/2023/ND-CP and the Personal Data Protection Law) **must be confirmed by legal counsel** before launch. |
| Security | No secrets in client bundles; service-role key server-only; answer keys never sent to the client before an attempt is submitted. |
| Reliability | Learning session survives brief network loss (attempts queued and retried). |

## 8. Release definition (v1)

All **P0** items above, behind real Supabase auth + RLS, with at least 2 complete modules of education-reviewed content, passing the QA checklist defined in `IMPLEMENTATION_ROADMAP.md` (Sprint 05).

## 9. Open questions

1. Final skill taxonomy and content sign-off — who is the education reviewer?
2. Voiceover: professional voice actor vs. TTS for drafts only? (Recommendation: recorded VO for production, TTS only as placeholder in admin preview.)
3. Monetisation timing (free beta → subscription?) — affects whether a billing integration is needed in v1. Currently **out of scope**.
4. Legal review of consent text and privacy policy (Vietnam).
5. Hosting region (Supabase region — Singapore `ap-southeast-1` recommended for latency).
