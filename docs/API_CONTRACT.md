# little — API Contract (Sprints 04–05)

Two layers, one pattern (DECISIONS D-038):

1. **Postgres RPCs** (`supabase/migrations/20261122000300_learning_engine.sql`, `20261127000100_parent_experience.sql`) — the authoritative API, called as the signed-in user through PostgREST (`supabase.rpc(...)`).
2. **Next.js Server Functions** (`"use server"`) — thin, Zod-validated wrappers used by the UI. They add session/child checks and map results to UI types.

Route Handlers: `/auth/callback` and `/parent/settings/export` (file download). No Edge Functions.

## 1. Errors

RPC errors are Postgres exceptions surfaced by PostgREST as `{ code, message }`:

| SQLSTATE | `message` | Meaning |
|---|---|---|
| `42501` | `not_authenticated` | no session |
| `42501` | `forbidden` | not your family / unknown id (indistinguishable on purpose) |
| `P0001` | `child_archived` | the child profile is archived |
| `P0001` | `family_exists`, `consent_required`, `invalid_name`, `child_limit`, `invalid_child`, `profile_missing` | family/child rules |
| `P0001` | `lesson_not_found`, `lesson_locked`, `lesson_empty` | start rules |
| `P0001` | `session_not_active`, `session_incomplete` | session lifecycle |
| `P0001` | `question_mismatch`, `question_closed`, `question_unavailable`, `invalid_response`, `idempotency_key_required` | answering |
| `P0001` | `invalid_date`, `invalid_plan` | daily plan |
| `P0001` | `assessment_not_found`, `assessment_empty`, `run_not_active` | placement activity (plus the answering codes above) |
| `P0001` | `invite_limit`, `invite_invalid`, `already_in_family`, `owner_cannot_leave`, `cannot_remove_owner` | invitations & membership |
| `P0001` | `confirmation_mismatch`, `child_not_archived` | deletion |
| `P0001` | `invalid_entity`, `invalid_transition`, `not_found`, `key_missing`, `key_type_mismatch`, `key_inconsistent`, `key_incomplete`, `hint_invalid`, `cannot_revoke_own_admin` | staff/content |

Server Functions return `{ ok: false, code }` (learning) or a `FormState` with Vietnamese messages (forms); they never expose raw database errors to children.

## 2. RPCs

Ids: families/children/sessions are UUIDs; content is addressed by stable **slugs** (`alphabet-forest`, `af-l1`, `af-l1-q1`).

### Family & children
| RPC | Args | Returns |
|---|---|---|
| `create_family` | `p_display_name text, p_consent_version text` | `uuid` family id |
| `create_child` | `p_family_id uuid, p_nickname text, p_avatar_key text, p_birth_year smallint?, p_preferences jsonb?` | `uuid` child id |
| `archive_child` | `p_child_id uuid` | void (idempotent) |

Sprint 05:

| RPC | Args | Returns / rules |
|---|---|---|
| `restore_child` | `p_child_id` | void; member; respects the 6-child limit |
| `delete_child` | `p_child_id, p_confirm_nickname` | void; **owner**, archived child only, nickname must match |
| `create_family_invite` | — | `{id, code, expiresAt}`; **owner**; ≤ 3 open; the code is returned once |
| `revoke_family_invite` | `p_invite_id` | void; owner |
| `accept_family_invite` | `p_code, p_consent_version` | family `uuid`; caller must not be in a family; same `invite_invalid` for every bad code |
| `remove_family_member` | `p_user_id` | void; owner; guardians only |
| `leave_family` | — | void; guardians |
| `export_family_data` | — | JSON of the caller's family (account, members, consents, children with sessions/attempts/progress/mastery/rewards/plans/placement answers) |
| `delete_family` | `p_confirm_name` | void; owner; family name typed exactly |
| `delete_my_account` | `p_confirm` | void; family name (or `XOA` without a family); deletes `auth.users` |

Reads use RLS-scoped table selects: `families`, `family_members`, `children` (see `src/features/family/queries.ts`). Child updates: `update children set nickname/avatar_key/birth_year/preferences/rewards_seen_at`.

### Learning
| RPC | Args | Returns |
|---|---|---|
| `get_student_overview` | `p_child_id` | `Overview` (below) |
| `start_session` | `p_child_id, p_lesson_slug, p_restart bool = false` | `SessionState & { resumed }` — idempotent: returns the open session unless `restart` |
| `get_active_session` | `p_child_id, p_lesson_slug` | `SessionState \| null` |
| `get_session_state` | `p_session_id` | `SessionState` |
| `submit_attempt` | `p_session_id, p_question_slug, p_response jsonb, p_idempotency_key uuid` | `AttemptResult` |
| `request_hint` | `p_session_id, p_question_slug` | `{ text, eliminateOptionId \| null }` |
| `complete_session` | `p_session_id` | `SessionResult` (idempotent; finishes if all questions are done) |
| `get_session_result` | `p_session_id` | `SessionResult` |
| `abandon_session` | `p_session_id` | void (idempotent; attempts kept) |
| `ensure_daily_plan` | `p_child_id, p_plan_date date, p_lesson_slugs text[]` | `text[]` — stored plan for that date (first call wins) |

```ts
type SessionState = {
  sessionId: string; lessonId: string; status: "in_progress" | "completed" | "abandoned";
  currentIndex: number;   // 0-based; = finished questions
  total: number; startedAt: string;
  attempt: number;        // next attempt number for the current question (server-counted)
  results: { questionId: string; correct: boolean; firstTry: boolean; attempts: number }[];
};

// p_response (validated against the question's public config)
type Response =
  | { type: "single_choice" | "image_choice"; optionId: string }
  | { type: "matching"; pairs: [left: string, right: string][] }     // each id once
  | { type: "ordering"; order: string[] }                             // full permutation
  | { type: "pattern"; fills: string[] }                              // one per blank
  | { type: "memory"; pairs: [string, string][]; moves?: number };    // finished board

type AttemptResult = {
  attemptId: string; attemptNo: number;
  isCorrect: boolean;               // score === maxScore
  score: number; maxScore: number;  // partial credit reported (pairs/positions/blanks)
  feedback: { text: string };
  canRetry: boolean;
  nextAction: "retry" | "continue" | "complete";
  reveal: null | { type: "choice"; optionId } | { type: "matching"; pairs }
               | { type: "ordering"; order } | { type: "pattern"; fills }; // only when finished AND wrong
  replayed: boolean;                // true when the idempotency key was seen before
};

type SessionResult = {
  sessionId; lessonId; status; stars: 0..3; total; correct; firstTry;
  score; maxScore; startedAt; completedAt: string | null; durationSeconds: number | null;
  newRewards: string[];             // reward keys granted by this session
};

type Overview = {
  child: { id; nickname; avatarKey; rewardsSeenAt: string | null };
  modules: { id; state: "locked" | "available" | "completed"; completed; total }[];
  lessons: { id; state; record: null | { bestStars; plays; firstCompletedAt; lastCompletedAt;
             last: { stars; total; correct; firstTry; newRewards: string[] } | null } }[];
  rewards: { id; earnedAt; reason }[];
  history: ({ type: "lesson"; lessonId; stars; at } | { type: "badge"; rewardId; at })[]; // ≤ 100 + 50, most recent
  inProgress: SessionState | null;   // most recently active
  mastery: { skillId; state; accuracy; evidence; lastPracticedAt }[];
};
```

**Idempotency:** `submit_attempt` is idempotent per `(session, p_idempotency_key)` (unique constraint + row lock). The client creates one key per try and reuses it on network retries. `start_session` is idempotent through the "one open session per child+lesson" unique index. Reward grants are unique per `(child, reward)`. `complete_session`, `abandon_session`, `archive_child` are safe to repeat.

### Parent report & placement (Sprint 05)
| RPC | Args | Returns |
|---|---|---|
| `get_child_report` | `p_child_id` | `{child, totals{sessionsCompleted, activeSeconds, lessonsCompleted, stars, badges, activeDays7}, last7[{date, sessions, seconds}], modules[{moduleId,total,completed,stars,lastAt}], skills[{skillId,state,accuracy,evidence,sessions,lastPracticedAt}], recent[≤20], assessment}` (archived children allowed) |
| `start_assessment` | `p_child_id, p_assessment_slug, p_restart` | run state `{runId, assessmentId, status, currentIndex, total, startedAt, resumed}`; one open run per child+activity |
| `get_active_assessment` | `p_child_id, p_assessment_slug` | run state or `null` (read-only) |
| `submit_assessment_item` | `p_run_id, p_question_slug, p_response, p_idempotency_key` | `{nextAction: continue\|complete, currentIndex, replayed}` — **no correctness** |
| `get_assessment_summary` | `p_child_id, p_run_id?` | latest completed run `{runId, title, startedAt, completedAt, items, modules[{moduleId, items, correct, band}]}` or `null` |

### Staff
| RPC | Args | Notes |
|---|---|---|
| `grant_staff_role` / `revoke_staff_role` | `p_user_id, p_role` | admin only |
| `set_content_status` | `p_entity ('module'\|'skill'\|'lesson'\|'question'\|'reward'), p_id, p_status` | workflow in SECURITY_AND_RLS §5 |

### Published content (reads)
`modules → skills → lessons → lesson_questions → questions`, `rewards` via table selects with the publishable key (anon or user). See `src/features/learning/backend/content.ts`. Pagination: the catalogue is bounded (7 modules); child history in the overview is capped (100 lessons, 50 badges).

## 3. Server Functions (UI layer)

| Function | File | Input (Zod) | Behaviour |
|---|---|---|---|
| `signUpAction`, `signInAction`, `requestPasswordResetAction`, `updatePasswordAction`, `signOutAction` | `features/auth/actions.ts` | email, password (≥ 8, letters + digits), `next` (safe path) | `FormState`; redirects on success |
| `createFamilyAction` | `features/family/actions.ts` | name 1–60, consent checkbox | → `/parent/children/new` |
| `createChildAction`, `updateChildAction(childId)` | 〃 | nickname 1–20, avatar from catalogue, birth year (optional, last 12 years), voice/sounds toggles | family id from the session, never the form |
| `archiveChildAction(childId)` | 〃 | uuid | clears the selected-child cookie if it was that child |
| `selectChildAction(childId)`, `leaveStudentAction()` | 〃 | uuid | sets/clears httpOnly `little_child` after RLS check |
| `startLessonAction` | `features/learning/backend/actions.ts` | `{ lessonId slug, restart }` | `start_session` for the selected child → redirect to player |
| `submitAnswerAction` | 〃 | `{ sessionId uuid, questionId slug, response, idempotencyKey uuid }` | session pinned to the selected child → `submit_attempt` → `{ ok, correct, final, message, reveal?, nextAction }` |
| `requestHintAction` | 〃 | `{ sessionId, questionId }` | → `request_hint` |
| `markRewardsSeenAction` | 〃 | — | updates `rewards_seen_at` of the selected child |
| `startPlacementAction` | 〃 | `{ childId uuid, activityId slug, restart }` | parent side: RLS-checks the child, `start_assessment`, selects the child → `/student/discover/[activityId]` |
| `submitPlacementAction` | 〃 | `{ runId, questionId, response, idempotencyKey }` | run pinned to the selected child → `submit_assessment_item` → `{ ok, nextAction }` |
| `restoreChildAction`, `deleteChildAction(childId)` | `features/family/actions.ts` | uuid; confirmation text | → `restore_child` / `delete_child` |
| `updateFamilyNameAction`, `createInviteAction`, `revokeInviteAction`, `removeMemberAction`, `leaveFamilyAction`, `joinFamilyAction`, `deleteFamilyAction`, `deleteAccountAction` | `features/family/settings-actions.ts` | name 1–60; code (10 symbols) + consent; typed confirmation | wrap the RPCs above; account deletion also clears the session cookies |

`createChildAction`/`updateChildAction` also accept `sessionMinutes` ("", 10, 15, 20, 30) stored in `children.preferences.sessionMinutes`.

## 4. Routes

| Route | Access |
|---|---|
| `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` | public (`noindex`) |
| `/auth/callback` (GET) | email links; `code` (PKCE) or `token_hash`+`type`; `next` sanitised |
| `/parent`, `/parent/onboarding`, `/parent/children/new`, `/parent/children/[childId]` (report), `/parent/children/[childId]/edit`, `/parent/children/[childId]/discover`, `/parent/settings` | signed in (+ family, except onboarding) |
| `/parent/settings/export` (GET) | signed in; JSON attachment, `Cache-Control: no-store`; signed out → login redirect |
| `/privacy` | public draft (`noindex`), pending legal review |
| `/student/discover/[activityId]` | signed in + selected child + an open run (never creates one) |
| `/student/welcome` | public |
| `/student/profiles` | signed in + family |
| `/student/home`, `/explore`, `/worlds/[moduleId]`, `/rewards`, `/lessons/[lessonId]`, `/lessons/[lessonId]/play`, `/lessons/[lessonId]/result?session=` | signed in + selected child |
