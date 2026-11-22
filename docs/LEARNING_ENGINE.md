# little — Student Experience & Learning Engine (Sprints 03–04)

> **Status (Sprint 04):** the student experience runs on **Supabase**: content from PostgreSQL, grading inside a Postgres RPC with private keys, sessions/attempts/progress/rewards/mastery persisted per child, behind parent sign-in. Verified on a local Supabase stack; not deployed to a hosted project. The Sprint 03 device-local demo store has been removed. Backend details: BACKEND_ARCHITECTURE.md, API_CONTRACT.md, SECURITY_AND_RLS.md.

## 1. Routes

| Route | Screen | Notes |
|---|---|---|
| `/student` | → redirects to `/student/welcome` | |
| `/student/welcome` | Welcome | Public; the child never types a password |
| `/student/profiles` | Profile selection | The signed-in guardian's family's active children (RLS) |
| `/student/home` | Student home | Greeting, daily plan, continue, daily reward, 7 worlds |
| `/student/explore` | Explore | 7 world cards, locked/available/completed |
| `/student/worlds/[moduleId]` | World (module) detail | Learning path per skill |
| `/student/lessons/[lessonId]` | Lesson introduction | Resume / restart when in progress |
| `/student/lessons/[lessonId]/play` | Activity player | All 6 question types |
| `/student/lessons/[lessonId]/result` | Lesson result | Effort-based message, stars, new badges |
| `/student/rewards` | Rewards | Stars, badges, history |

All `/student` pages except Welcome require a signed-in guardian (proxy + server checks); all but Profiles also need a selected child. Each page renders a static shell and streams child data inside `<Suspense>`. Unknown ids show a friendly "lost" page (`app/student/not-found.tsx`); with Partial Prerendering the HTTP status stays 200 + `noindex` (D-037). Load failures show `app/student/error.tsx` with a retry.

Every exit to adult functions goes through the parent gate (lock icon) → `ParentPanel` (parent area, switch child, sign out). The parent area (`/parent`) manages the family and child profiles; the full dashboard is Sprint 05.

## 2. Code layout

```
src/
  app/student/…                     routes: server components load data inside <Suspense>
  components/student/
    StudentScreen.tsx               shell + child navigation + gated ParentPanel + loading state
    StudentLoading.tsx              Suspense fallback
    VisualView.tsx, WelcomeScreen, ProfilesScreen
    home/ worlds/ lessons/ activities/ rewards/   (screens; read the server-built view via useStudent())
  features/learning/
    types.ts                        public content model + response types
    backend/content.ts              published catalogue & lessons from Postgres ('use cache')
    backend/student.ts              selected child, overview RPC → StudentView, sessions, results
    backend/overview.ts             Zod schemas for RPC JSON + mapping (unit-tested)
    backend/actions.ts              startLesson / submitAnswer / requestHint / markRewardsSeen
    student-context.tsx             StudentProvider/useStudent (client) + sound preferences
    session/reducer.ts              player UI state machine (no authority)
    progress/{model,calc,rewards}   view-model types, display helpers (time zone, daily plan), badge labels
    content/catalog.ts              pure catalogue helpers
    grading/keys.ts                 AnswerKey type (seed source)
  data/demo/                        SEED SOURCE + test fixtures only (never imported by app code)
    worlds/*.ts, answer-keys.ts (server-only), seed-sql.ts → supabase/seed.sql
supabase/migrations/…_learning_engine.sql   grading, sessions, progression, stars, rewards, mastery
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
LessonPlayer ──submitAnswerAction({sessionId, questionId, response, idempotencyKey})──► Server Function
   Zod · signed-in guardian · session belongs to the SELECTED child
        └──► rpc submit_attempt (SECURITY DEFINER, one transaction)
               lock session · replay idempotency key · question must be the current one
               attempt_no counted server-side · validate response vs public config
               grade vs private.question_answer_keys · insert attempt · mastery
               advance / finish session · stars · lesson progress · rewards
        ◄── { isCorrect, score, maxScore, feedback, canRetry, nextAction, reveal? }
```

- **Per type** (`private.grade_response`): choice = option id; matching = each correct pair scores 1 (partial credit reported, correct only when all pairs right); ordering = positions in place (full permutation required); pattern = blanks filled correctly; memory = the finished board's pairs checked against the **private** pairs (a client claiming success with wrong pairs is marked incorrect).
- `reveal` (the answer to that one question) only when the question is finished and wrong (D-040). Hints return encouragement and, for choice questions, one **wrong** option to fade.
- Option ids are opaque and never encode correctness. By-design exceptions: memory cards carry `pairKey`; "remember" questions show items before asking.
- **Verified:** DB tests grade all 84 questions (all six types) correct with the key and reject wrong/malformed/out-of-order/forged answers; browser scan shows no key data in any response; build output contains no keys.

## 5. Session behaviour

- **Start** (`start_session`): from the lesson intro ("Cùng học nhé!" / "Học tiếp nhé!" / "Học lại từ đầu" → `restart`). Checks child access, publication and unlock rules; returns the open session if one exists (idempotent). The `/play` URL only reads the open session — opening it never creates data; without a session it redirects to the intro.
- **Answer**: see §4. Wrong & not final → try again (server attempt +1), no Continue button. Final → feedback + "Tiếp tục" / "Xem kết quả".
- **Duplicates**: one idempotency key per try, reused on network retry → recorded once (tested with 6 concurrent duplicates).
- **Resume**: the session's `currentIndex` and next `attempt` come from the server, so refresh, another tab or another device continues on the same question with the same try count.
- **Complete**: the last final answer completes the session in the same transaction (stars, best result, rewards). `complete_session` is an idempotent read/repair.
- **Abandon**: restart abandons the old session (attempts kept); archiving a child abandons open sessions.
- **Stale UI** (e.g. a second tab moved on): the server answers `question_mismatch` and the player reloads the intro.

## 6. Progress, stars, rewards, mastery

| Rule | Where |
|---|---|
| Stars per lesson (D-032) | `private.stars_for`: 1 + (≥ half first-try) + (all first-try). Best kept in `child_lesson_progress` |
| Lesson & world unlocking (D-031) | `private.child_lesson_states` — the **single** source used by both `start_session` (enforcement) and the overview (display) |
| Rewards | `private.evaluate_rewards` with data-driven `rewards.rule`; unique per child; reason recorded |
| Mastery | `private.recompute_skill_mastery`, configurable thresholds (DATABASE_SCHEMA §7, D-042) |
| Daily plan | proposed by `buildDailyPlan` from the server's lesson states, stored once per day by `ensure_daily_plan`; "today" = Asia/Ho_Chi_Minh (D-045) |
| Result copy | "Con đã hoàn thành hành trình hôm nay!" (all first try) or "Con đã rất cố gắng. Cùng khám phá thêm nhé!" — never "smart/weak", no ranking |

The result page shows the authoritative `get_session_result` for the session just played (pinned to the selected child), else the child's latest result for that lesson.

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

## 8. Migration to Supabase — done in Sprint 04

| Sprint 03 (demo) | Sprint 04 (implemented) |
|---|---|
| `demoContentRepository` (local files) | `backend/content.ts` — published rows from Postgres, cached |
| `data/demo/answer-keys.ts` | `private.question_answer_keys` (seeded from the same file) |
| `submitAnswer` Server Action + TS grader | `submitAnswerAction` → `submit_attempt` RPC (TS grader removed) |
| `demoStore` (localStorage) profiles & selection | `children` under RLS + httpOnly `little_child` cookie re-validated per request |
| progress in localStorage | `learning_sessions`, `question_attempts`, `child_lesson_progress`, `skill_mastery`, `child_rewards`, `child_daily_plans` |
| client-counted attempts | server-counted, idempotent attempts |

The 84 demo questions are the **development seed** (`supabase/seed.sql`, generated and checked by `seed.test.ts`).

## 9. Audio

- Every instruction uses `AudioInstruction` (text + optional `instructionAudioUrl`, replay button).
- With a recorded file: real playback, a loading state while downloading, and a fallback to speech if the file fails.
- **No recorded audio exists yet.** Without a file the control is labelled **"Âm thanh demo"** and uses the browser's speech synthesis. If the device has no Vietnamese voice, it shows **"Chưa có âm thanh"** (unavailable). It never pretends audio played.
- Feedback lines and hints are spoken the same way (demo voice).

## 10. Known limitations

- Runs against a local Supabase stack; no hosted project yet (DECISIONS P-1).
- Placeholder art (SVG); no recorded voice-over (speech synthesis, labelled "Âm thanh demo"; "Chưa có âm thanh" when the device has no Vietnamese voice).
- No offline answer queue: a failed request shows a retry message; the retry is safe (idempotent).
- `notFound()` on unknown ids returns status 200 (+ noindex) under Partial Prerendering.
- No L4 questions; English Island uses only picture choice; content awaits education review (P-4).
- Memorize steps auto-advance after 3–5 s (or "Con nhớ rồi"); no replay.
- Hints are not recorded and do not affect mastery.
- Not tested on a physical iPad / Safari.
