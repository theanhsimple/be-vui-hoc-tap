# little — Student Experience & Learning Engine (Sprint 03)

> **Status:** Implemented in Sprint 03 as a **demo**. Content and answer grading run on the Next.js server from local files; progress is stored **only on the device** (`localStorage`). Nothing is stored in a database yet. See §8 for the Supabase migration path.

## 1. Routes

| Route | Screen | Notes |
|---|---|---|
| `/student` | → redirects to `/student/welcome` | |
| `/student/welcome` | Welcome | No login on the child's screen |
| `/student/profiles` | Profile selection | This family's children only (demo family) |
| `/student/home` | Student home | Greeting, daily plan, continue, daily reward, 7 worlds |
| `/student/explore` | Explore | 7 world cards, locked/available/completed |
| `/student/worlds/[moduleId]` | World (module) detail | Learning path per skill |
| `/student/lessons/[lessonId]` | Lesson introduction | Resume / restart when in progress |
| `/student/lessons/[lessonId]/play` | Activity player | All 6 question types |
| `/student/lessons/[lessonId]/result` | Lesson result | Effort-based message, stars, new badges |
| `/student/rewards` | Rewards | Stars, badges, history |

All world and lesson pages are prerendered (`generateStaticParams`). Unknown ids show a friendly "lost" page (`app/student/not-found.tsx`); with Partial Prerendering the HTTP status stays 200 + `noindex` because the static shell has already streamed (documented Next.js behaviour).

Every exit to adult functions goes through the parent gate (lock icon) → `ParentDemoPanel` (switch child, reset demo data). The real parent area is Sprint 05.

## 2. Code layout

```
src/
  app/student/…                     route files (server): load public content, render client screens
  components/student/
    StudentScreen.tsx               shell + child navigation + gated parent panel + loading state
    VisualView.tsx                  renders a content Visual (illustration / letter-number tile / counting group)
    WelcomeScreen, ProfilesScreen
    home/                           HomeScreen, DailyLearningCard, ContinueCard, DailyRewardCard
    worlds/                         ExploreScreen, WorldCard, WorldDetailScreen, LessonPath
    lessons/                        LessonIntroScreen, LessonPlayer, MemorizeStage, LessonResultScreen
    activities/                     ActivityRenderer (type registry), ChoiceActivity, Matching/Ordering/Pattern/Memory
    rewards/                        RewardsScreen, BadgeTile
  features/learning/
    types.ts                        public content model + response/grade types
    content/repository.ts           ContentRepository interface + demo implementation
    grading/grade.ts                pure grading (shared with the future backend)
    grading/actions.ts              Server Actions submitAnswer / requestHint (Zod-validated)
    grading/keys.ts                 AnswerKey type
    session/reducer.ts              lesson player state machine
    progress/{model,calc,rewards}   progress model, stars, unlock rules, daily plan, badges
    store/{demoStore,hooks}         device-local demo store + React hooks
  data/demo/
    worlds/*.ts                     PUBLIC demo content (7 worlds, 28 lessons, 84 questions)
    answer-keys.ts                  PRIVATE answer keys — `import "server-only"`
    helpers.ts, index.ts
  illustrations/placeholders-content.tsx   placeholder art for the content
```

## 3. Question data contract

The brief's contract was adapted to the existing design (no duplicate models):

| Brief | Implemented | Why |
|---|---|---|
| `imageUrl` | `stimulus?: Visual` / option `visual: Visual` | Art is referenced by registry name (illustration, letter/number tile, counting group) so placeholders are replaceable (D-024) |
| `config: Record<string, unknown>` | discriminated union per `type` | Strict typing, no `any`; each type's config is checked at compile time |
| `options` | on choice types; `config.left/right`, `config.items`, `config.sequence/palette`, `config.cards` for the others | Each activity needs a different shape |
| `difficulty: L1–L4` | same | |
| `feedback` | same (never contains the answer) | |
| — | `memorize?: { visuals, seconds }` | "Look, then answer" questions (memory skills) |
| — | `maxAttempts?` (default 2) | Retry policy per question |

Types: `single_choice` (optional confirm step), `image_choice` (tap = answer), `matching` (tap-to-match), `ordering` (tap-to-place), `pattern` (fill the blank(s)), `memory` (flip cards, configurable cards, `peekAfterMismatches` gentle help).

`DATABASE_SCHEMA.md` was updated: `question_type` now uses these six values.

## 4. Grading — answer keys never reach the device

```
LessonPlayer (client) ──submitAnswer({lessonId, questionId, attempt, response})──► Server Action
                                                                                    ├─ Zod-validate input (public endpoint)
                                                                                    ├─ load question (repository) + key (server-only module)
                                                                                    ├─ check the response matches the question's options
                                                                                    └─ gradeResponse() → { correct, final, reveal?, message }
```

- The correct answer (`reveal`) is returned **only** when the question is finished (correct, or the last allowed try).
- Hints (`requestHint`) return encouragement text and, for choice questions, one *wrong* option to fade out.
- Option ids are opaque (`a`, `b`, `l1`, `r2`…) and never encode correctness.
- **Verified:** after `next build`, no client chunk contains the keys module marker or key data, and prerendered play pages contain questions but no keys (QA script, Sprint 03). A unit test also fails if any non-server file imports the keys.
- **By-design exceptions** (inherent to the activity): memory cards carry `pairKey`; "remember" questions show the items before asking. Both are visible to the child anyway.
- **Demo limitation:** the attempt number is sent by the client and nothing is stored server-side. In Sprint 04 `submit_attempt` (Postgres RPC) counts attempts in `question_attempts`, checks the guardian session and child access, and updates `skill_mastery`; `gradeResponse` logic moves into / mirrors that function.

## 5. Session behaviour

`session/reducer.ts`: `memorize? → answering ⇄ grading → feedback → next | complete`

- Submit is ignored unless answering (no double submits, also guarded by an in-flight ref).
- Wrong & not final → try again (attempt + 1), the wrong pick stays marked until the child chooses another; no "Continue" is shown.
- Final (correct or last try) → feedback panel + "Tiếp tục" / "Xem kết quả".
- Grading/network failure → gentle message, back to answering.
- Progress is saved after every finished question **and every try**, so a refresh or exit resumes on the same question with the same try count.
- Exit asks for confirmation (spoken), progress is kept.

## 6. Progress, stars, rewards

| Rule | Implementation |
|---|---|
| Stars per lesson (D-032) | 1 for finishing + 1 if ≥ half right first time + 1 if all right first time. Best result kept; replays never reduce stars |
| Lesson unlock (D-031) | First lesson of each skill open; next lesson opens after the previous one in the same skill (L1 → L2 progression) |
| World unlock (D-031) | All worlds open except Challenge Arena (mixed review), which opens after 3 completed lessons anywhere |
| Daily plan | 3 open lessons from different worlds (≈ 15 min), rotating by date, saved for the day; review when everything is done. No streaks, nothing lost for missed days |
| Badges | Explorer Star (1st lesson), Curious Mind (3 worlds), Little Reader / Number Finder / Memory Master (2 lessons in that world), Brave Challenger (1 arena lesson) — all completion/effort based |
| Result copy | "Con đã hoàn thành hành trình hôm nay!" (all first try) or "Con đã rất cố gắng. Cùng khám phá thêm nhé!" — never "smart/weak", no ranking |

All rules are pure functions in `progress/calc.ts` with unit tests.

## 7. Demo content library

84 questions · 28 lessons · 14 skills · 7 worlds (2 skills × 2 lessons × 3 questions each).

| World | single | image | matching | ordering | pattern | memory |
|---|---|---|---|---|---|---|
| Alphabet Forest | 4 | 5 | 2 | – | – | 1 |
| Number Kingdom | 4 | 4 | 1 | 2 | 1 | – |
| IQ Castle | – | 5 | 1 | 1 | 5 | – |
| Memory Garden | – | 3 | – | 3 | – | 6 |
| English Island | – | 12 | – | – | – | – |
| School Town | 2 | 6 | – | 3 | – | 1 |
| Challenge Arena | 3 | 3 | 1 | 2 | 2 | 1 |
| **Total** | **13** | **38** | **5** | **11** | **8** | **9** |

Difficulty: L1 39 · L2 38 · L3 7 · L4 0 (L4 content not authored yet).

**Answer verification** (`src/data/demo/content.test.ts`): structure and key consistency for all 84; **semantic re-computation** of answers for counting, "which letter", largest/smallest, group matching, ordering by quantity, remember-the-order, what-did-you-see, follow-the-teacher, initial sounds (checked unambiguous, incl. c/ch), upper/lower-case matching, pattern continuation, English "Find …", and "Đâu là <thing>". Remaining questions (odd-one-out, routines, classroom use, colour→fruit matching) were checked manually.

Content is demo material written for this sprint. It is **not** official curriculum and **not** entrance-exam material (no Newton, Pascal, Đoàn Thị Điểm or other school is referenced). It needs education-reviewer sign-off (DECISIONS P-4).

## 8. Migration path to Supabase (Sprint 04)

| Today (demo) | Sprint 04 |
|---|---|
| `demoContentRepository` (local files) | `SupabaseContentRepository`: published modules/skills/lessons/questions under RLS; same `ContentRepository` interface |
| `data/demo/answer-keys.ts` (server-only) | `private.question_keys`; grading inside `submit_attempt` (security definer) |
| `submitAnswer` Server Action | thin action calling the RPC as the signed-in guardian |
| `demoStore` (localStorage) — demo family, selected child | `children` via RLS for the guardian's family; selected child in an httpOnly cookie validated server-side (ARCHITECTURE §3.2) |
| progress in localStorage | `learning_sessions`, `question_attempts`, `skill_mastery`, `child_rewards`; a `ProgressRepository` replaces the store's progress API, `progress/calc.ts` keeps the pure rules |
| client-counted attempts | server-counted attempts (idempotent on session, question, attempt_no) |

The demo store and demo content must not be imported by production code paths once Supabase is live; they stay available behind the demo repository for local development.

## 9. Audio

- Every instruction uses `AudioInstruction` (text + optional `instructionAudioUrl`, replay button).
- With a recorded file: real playback, a loading state while downloading, and a fallback to speech if the file fails.
- **No recorded audio exists yet.** Without a file the control is labelled **"Âm thanh demo"** and uses the browser's speech synthesis. If the device has no Vietnamese voice, it shows **"Chưa có âm thanh"** (unavailable). It never pretends audio played.
- Feedback lines and hints are spoken the same way (demo voice).

## 10. Known limitations

- Demo progress is per device and per browser, unencrypted, and not a backend (no multi-device sync).
- Placeholder art (SVG) for mascot, worlds, objects and badges.
- No recorded voice-over; speech synthesis depends on the device.
- Attempts are counted by the client (see §4).
- `notFound()` on unknown ids returns status 200 (+ noindex) under Partial Prerendering.
- No L4 questions; English Island uses only picture choice.
- Memorize steps auto-advance after 3–5 s (the child can also tap "Con nhớ rồi"); there's no replay yet.
- Not tested on a physical iPad / Safari.
