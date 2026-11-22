# little — Database Schema (implemented, Sprint 04)

> **Status:** implemented as versioned migrations in `supabase/migrations/` and **applied to a local Supabase stack only** (Postgres 17). Not applied to any hosted project. Source of truth: the SQL files; this document explains them. Security model: SECURITY_AND_RLS.md.

Conventions: `uuid` PKs (`gen_random_uuid()`); content also has a unique **slug** (stable id used by the app and the seed); `timestamptz` (UTC) with defaults; `updated_at` maintained by trigger; `snake_case`; enums for closed sets; family data is **archived**, not deleted.

## 1. Schemas

| Schema | Exposed via API | Contents |
|---|---|---|
| `public` | yes (RLS on every table) | app tables, RPCs |
| `private` | **no** | `question_answer_keys`, `mastery_config`, helper & internal functions |
| `auth`, `storage` | Supabase-managed | users; buckets/objects |

## 2. Enums

```
family_role        owner | guardian
membership_status  active | invited | removed
staff_role         content_editor | content_reviewer | publisher | admin
content_status     draft | in_review | published | archived
question_type      single_choice | image_choice | matching | ordering | pattern | memory
child_status       active | archived
session_status     in_progress | completed | abandoned
mastery_state      not_started | learning | practicing | mastered | review
reward_kind        badge | sticker | real_world
```

## 3. Relationships

```
auth.users 1─1 profiles 1─* family_members *─1 families 1─* children
profiles 1─* staff_roles                     families 1─* guardian_consents
modules 1─* skills 1─* lessons *─* questions (lesson_questions, ordered)
questions 1─1 private.question_answer_keys          skills 1─* questions
children 1─* learning_sessions 1─* question_attempts (→ questions, skills)
children 1─* child_lesson_progress (→ lessons)      children 1─* skill_mastery (→ skills)
children 1─* child_rewards (→ rewards, learning_sessions)   children 1─* child_daily_plans
assessments 1─* assessment_items (→ questions)      children 1─* assessment_attempts
```

## 4. Tables

### Identity & family
| Table | Key columns & constraints |
|---|---|
| `profiles` | `id` PK → `auth.users` (cascade); `display_name` ≤ 60; `locale` vi/en. Row created by trigger on sign-up. |
| `families` | `display_name` 1–60 (trimmed); `created_by` → profiles (set null); `archived_at` |
| `family_members` | PK (`family_id`, `user_id`); `role`; `status`; `invited_by`; **unique active owner per family** (partial index) |
| `guardian_consents` | `family_id`, `user_id`, `consent_version` (`^[a-z0-9.-]{1,32}$`), `consented_at`, `withdrawn_at` |
| `children` | `family_id` → families (cascade); `nickname` 1–20; `avatar_key` from a fixed catalogue; `birth_year` optional (no full DOB, no photo, no email); `preferences` jsonb object ≤ 2 KB (`{voice, sounds}`, Zod-validated); `status` + `archived_at` (consistent by CHECK); `rewards_seen_at` |
| `staff_roles` | PK (`user_id`, `role`); `granted_by`, `granted_at` |

### Content
| Table | Key columns & constraints |
|---|---|
| `modules` | `slug` unique; `title_vi/en`, `category`, `description`, `tone`, `illustration`, `sort_order`; `unlock_min_completed_lessons` (D-031); `status`, `published_at` |
| `skills` | `module_id` → modules (restrict); `slug`; `title_vi`; `sort_order`; `status` |
| `lessons` | `skill_id` → skills (restrict); `slug`; `title_vi`, `objective_vi`, `minutes` 1–30, `cover` jsonb; `sort_order`; `status` |
| `questions` | `slug`; `skill_id`; `type`; `difficulty` 1–4 (L1–L4); `prompt_vi`; `instruction_audio_url` (https or relative); `stimulus`, `memorize`, `feedback` jsonb; **`config` jsonb — public options/items/cards, no correctness**; `max_attempts` 1–5 (default 2); `status` |
| `private.question_answer_keys` | PK `question_id` → questions (cascade); `answer` jsonb (`{type:'choice',optionId}` · `{type:'matching',pairs}` · `{type:'ordering',order}` · `{type:'pattern',fills}` · `{type:'memory',pairs}`); `hint_eliminate` (a wrong option) |
| `lesson_questions` | PK (`lesson_id`, `position`); unique (`lesson_id`, `question_id`) |
| `rewards` | `key` unique; `kind`; titles; `criteria_vi`; `illustration`; **`rule` jsonb** evaluated by the server: `{kind:'lessons_completed',count}` · `{kind:'modules_explored',count}` · `{kind:'module_lessons_completed',module,count}`; `status` |

### Learning activity (written only by RPCs)
| Table | Key columns & constraints |
|---|---|
| `learning_sessions` | `child_id` (cascade), `lesson_id` (restrict), `status`, `current_index` (0-based, ≤ total), `total_questions`, `correct_count`, `incorrect_count`, `first_try_count`, `score`, `max_score`, `stars` 0–3, `started_by`, `started_at`, `completed_at`, `abandoned_at`, generated `duration_seconds`; CHECKs tie status to timestamps; **unique open session per (child, lesson)** |
| `question_attempts` | `session_id` (cascade), `child_id`, `question_id`, `skill_id`, `attempt_no` 1–10, `response` jsonb ≤ 4 KB, `is_correct`, `score`, `max_score`, `is_final`, `feedback_text`, `idempotency_key`; **unique (session, question, attempt_no)** and **unique (session, idempotency_key)** |
| `child_lesson_progress` | PK (`child_id`, `lesson_id`); `best_stars`; `completions`; `last_session_id`; first/last completed |
| `skill_mastery` | PK (`child_id`, `skill_id`); `state`; `accuracy`; `evidence_count`; `distinct_questions`; `session_count`; `mastered_at`; `last_practiced_at` |
| `child_rewards` | unique (`child_id`, `reward_id`); `session_id`; **`reason`** text; `granted_at` |
| `child_daily_plans` | PK (`child_id`, `plan_date`); `lesson_ids uuid[]` (1–5) |
| `child_module_progress` | **view** (`security_invoker`): completed lessons, stars, last activity per child × module |
| `private.mastery_config` | single row: `min_accuracy 0.8`, `min_evidence 10`, `min_sessions 2`, `min_distinct_questions 4`, `window_days 60`, `learning_max_evidence 4`, `learning_max_accuracy 0.5` |

### Assessment (prepared, no experience yet)
`assessments` (slug, title, purpose placement/checkpoint, status) · `assessment_items` (ordered questions) · `assessment_attempts` (child, question, response, is_correct, idempotency key unique per assessment+child). Staff-only reads; no RPCs yet.

### Audit
`audit_logs` (actor, action, entity, entity_id, meta, created_at) — written by definer functions (`family.create`, `child.create`, `child.archive`, `staff_role.grant/revoke`, `content.status`); admin-readable. `content_publication_history` (entity, id, from → to, actor) — staff-readable.

## 5. Deletion & archiving

- Children: `archive_child` (status + `archived_at`, open sessions abandoned). History is kept. Hard deletion only through a future guardian-initiated deletion flow (not implemented).
- Content: `restrict` FKs prevent deleting content that has learning history; content is archived via `set_content_status`.
- Deleting an auth user cascades to `profiles`, memberships and consents; families and children are **not** deleted automatically (family owner deletion flow: future work).

## 6. Not created (and why)

| Requested | Decision |
|---|---|
| `question_options` | Options are part of each question's typed public `config` (choice options, matching sides, ordering items, pattern palette, memory cards). A separate table would split one rendered unit across rows without a query that needs it (D-047). |
| `learning_paths` | The path is the ordering module → skill → lesson (`sort_order`), plus unlock rules; no per-child path data exists yet (D-047). |
| `child_module_progress` table | Derived → a view, so it can never disagree with lesson progress (D-047). |

## 7. Mastery rule (v1, configurable)

Evidence = **first attempts** on a skill's questions in the last `window_days` (retries don't count). Then:

- `mastered`: accuracy ≥ 0.8 **and** evidence ≥ 10 **and** sessions ≥ 2 **and** distinct questions ≥ 4.
- `review`: was mastered before, no longer meets the rule.
- `not_started`: no evidence. `learning`: evidence ≤ 4 or accuracy < 0.5. Otherwise `practicing`.

Recomputed in `submit_attempt` on every first attempt. Parameters live in `private.mastery_config` (DECISIONS D-042). This replaces the EWMA sketch of the original plan.

## 8. Indexes

`family_members(user_id) where active` · `children(family_id)` · `skills(module_id, sort_order)` · `lessons(skill_id, sort_order)` · `questions(skill_id, status)` · `lesson_questions(question_id)` · `learning_sessions(child_id, started_at desc)` + partial unique open-session index · `question_attempts(session_id)` · `question_attempts(child_id, skill_id, created_at desc)` · `child_rewards(session_id)` · `assessment_attempts(child_id, created_at desc)` · `audit_logs(created_at desc)` · `content_publication_history(entity, entity_id)` · plus all PK/unique indexes.
