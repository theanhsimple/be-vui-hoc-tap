# little — Database Schema (planned)

> **Status:** Plan only. No migrations exist and none have been run. All migrations will be **additive**, reviewed, and applied to a dev project first. No destructive migrations.

Postgres on Supabase. Conventions: `uuid` PKs (`gen_random_uuid()`), `created_at`/`updated_at timestamptz` on every table (trigger-maintained), `snake_case`, enums as Postgres enums, soft-delete via `archived_at` for family data.

## 1. Schemas

| Schema | Exposed via API? | Contents |
|--------|------------------|----------|
| `public` | Yes | All app tables, protected by RLS |
| `private` | **No** | Answer keys, grading rules, internal helpers |
| `auth`, `storage` | Supabase-managed | — |

## 2. Enums

```sql
staff_role          : 'editor' | 'admin'
guardian_role       : 'owner' | 'guardian'
content_status      : 'draft' | 'in_review' | 'published' | 'archived'
question_type       : 'single_choice' | 'image_choice' | 'matching' | 'ordering' | 'pattern' | 'memory'   -- updated Sprint 03 (D-030)
session_kind        : 'lesson' | 'assessment' | 'practice'
session_status      : 'active' | 'completed' | 'abandoned'
mastery_band        : 'not_started' | 'exploring' | 'developing' | 'confident'
reward_kind         : 'star' | 'sticker' | 'badge' | 'real_world'
```

## 3. Tables

### 3.1 Identity & family

**`profiles`** — 1:1 with `auth.users` (guardians and staff)
| column | type | notes |
|---|---|---|
| id | uuid PK → auth.users.id | on delete cascade |
| display_name | text | |
| locale | text default 'vi' | 'vi' \| 'en' |

**`families`**
| id | uuid PK |
|---|---|
| name | text |
| settings | jsonb — session time limit, music on/off, captions; Zod-validated |
| created_by | uuid → profiles |

**`family_members`** (= Guardians)
| family_id | uuid → families |
|---|---|
| profile_id | uuid → profiles |
| role | guardian_role |
| PK | (family_id, profile_id) |

**`guardian_consents`** — auditable consent records
| id, family_id, profile_id, consent_version text, consented_at timestamptz, withdrawn_at timestamptz null |

**`children`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| family_id | uuid → families | |
| nickname | text (1–20 chars) | no surname required |
| birth_year / birth_month | smallint | no full DOB (minimisation) |
| avatar_key | text | from a fixed catalogue; no photos |
| archived_at | timestamptz null | |

**`staff_roles`**
| profile_id uuid → profiles, role staff_role, granted_by uuid, granted_at | PK (profile_id, role) |

### 3.2 Content (CMS)

**`media_assets`**: id, bucket, path, kind ('image'|'audio'|'animation'|'video'), alt_text_vi, transcript_vi (for audio), width, height, duration_ms, tags text[], status content_status, uploaded_by.

**`modules`** (islands): id, slug unique, title_vi, title_en, description_vi, theme_color, cover_asset_id, title_audio_id, sort_order, unlock_rule jsonb, status.

**`skills`**: id, code unique (e.g. `NUM.COUNT.10`), domain text, title_vi, parent_description_vi, home_activity_vi, sort_order, status.

**`module_skills`**: (module_id, skill_id) PK.

**`lessons`**: id, module_id, slug, title_vi, icon_asset_id, sort_order, target_minutes smallint, status, published_at.

**`questions`** (safe-to-ship part)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| type | question_type | |
| skill_id | uuid → skills | primary skill |
| difficulty | smallint 1–5 | |
| prompt_audio_id | uuid → media_assets | **required to publish** |
| prompt_text_vi | text | caption / TTS fallback |
| content | jsonb | type-specific payload (`LearningQuestion` in `src/features/learning/types.ts`: options/left-right/items/sequence-palette/cards, stimulus, memorize, feedback, maxAttempts) — **contains no correctness info** |
| status | content_status | |

**`private.question_keys`**
| question_id | uuid PK → public.questions on delete cascade |
|---|---|
| answer | jsonb — `AnswerKey` in `src/features/learning/grading/keys.ts`: `{type:'choice', optionId, hintEliminate?}`, `{type:'ordering', order}`, `{type:'pattern', fills}`, `{type:'matching', pairs}`, `{type:'memory'}` |
| hint_audio_id | uuid null |

**`lesson_questions`**: (lesson_id, question_id) PK, position smallint.

**`assessments`**: id, slug, title_vi, purpose ('placement'), status.
**`assessment_items`**: (assessment_id, question_id) PK, position, skill_id.

**`rewards`** (catalogue): id, kind reward_kind, key, title_vi, asset_id, rule jsonb (e.g. "complete 3 lessons in Number Garden"), status.

### 3.3 Learning activity (child data)

**`learning_sessions`**
| id | uuid PK |
|---|---|
| child_id | uuid → children |
| kind | session_kind |
| lesson_id / assessment_id | uuid null (one set) |
| status | session_status |
| started_at, ended_at | timestamptz |
| stars_earned | smallint |
| started_by | uuid → profiles (guardian session that hosted it) |

**`question_attempts`**
| id | uuid PK |
|---|---|
| session_id | uuid → learning_sessions |
| question_id | uuid → questions |
| attempt_no | smallint (1..3) |
| response | jsonb |
| is_correct | boolean (computed server-side) |
| latency_ms | int |
| created_at | timestamptz |
| UNIQUE | (session_id, question_id, attempt_no) — idempotency |

**`skill_mastery`**
| child_id, skill_id | PK |
|---|---|
| score | numeric(4,3) 0–1 (exponentially weighted accuracy, first-try weighted) |
| band | mastery_band |
| evidence_count | int |
| last_practiced_at | timestamptz |

**`assessment_results`**: id, session_id, child_id, assessment_id, summary jsonb (per-skill observations), created_at.

**`child_rewards`**: id, child_id, reward_id, session_id null, earned_at, redeemed_at null (for parent-confirmed real-world rewards carried over from the prototype's "Phiếu bé ngoan").

**`audit_log`**: id, actor_id, action, entity, entity_id, meta jsonb, created_at (staff actions, publish, role changes, data exports/deletions).

## 4. Key functions (RPC)

| Function | Security | Purpose |
|----------|----------|---------|
| `is_family_member(family_id)` | definer, stable | RLS helper |
| `can_access_child(child_id)` | definer, stable | RLS helper |
| `is_staff()`, `has_staff_role(role)` | definer, stable | RLS helper |
| `create_family(name, consent_version)` | definer | Creates family + owner membership + consent row atomically |
| `start_session(child_id, lesson_id \| assessment_id)` | definer | Checks access, returns session + ordered question payloads (shuffled options, no keys) |
| `submit_attempt(session_id, question_id, attempt_no, response, latency_ms)` | definer | Grades against `private.question_keys`, inserts attempt, updates `skill_mastery`, returns feedback |
| `finish_session(session_id)` | definer | Computes stars, awards rewards, closes session |
| `publish_content(entity, id)` | definer, staff | Validates completeness (audio, alt text, key present), sets status, audits |
| `delete_family_data(family_id)` | definer, owner | Guardian-initiated deletion |

All definer functions: `set search_path = ''`, fully-qualified names, explicit access checks at the top.

## 5. RLS plan

| Table | select | insert / update / delete |
|-------|--------|--------------------------|
| profiles | own row | own row (update) |
| families | `is_family_member(id)` | via `create_family`; update by owner |
| family_members | members of same family | owner only |
| guardian_consents | members of family | via RPC only |
| children | `is_family_member(family_id)` | family members |
| staff_roles | self or admin | admin only |
| modules / skills / lessons / questions / assessments / rewards / media_assets / join tables | authenticated: `status = 'published'`; staff: all | staff (editor+), publish via RPC |
| `private.*` | no API exposure | definer functions / service role only |
| learning_sessions, question_attempts, skill_mastery, assessment_results, child_rewards | `can_access_child(child_id)` | **none directly** — RPCs only (except `child_rewards.redeemed_at` update by guardian) |
| audit_log | admin | insert via definer functions only |

Storage policies: `content-public` public read, staff write; `content-drafts` staff only; `family-exports` object path prefixed by `family_id`, readable by family members.

**Tests:** pgTAP suite per table: anon denied; guardian A cannot see family B; staff cannot read child data; `questions` select never joins keys; `submit_attempt` rejects foreign `session_id`.

## 6. Indexes (initial)

`children(family_id)`, `family_members(profile_id)`, `lessons(module_id, sort_order)`, `questions(skill_id, status)`, `lesson_questions(lesson_id, position)`, `learning_sessions(child_id, started_at desc)`, `question_attempts(session_id)`, `skill_mastery(child_id)`, `child_rewards(child_id)`.

## 7. Mastery model (v1, intentionally simple)

`score ← score + α·(signal − score)`, α = 0.3, signal = 1.0 first-try correct, 0.6 second-try, 0 otherwise. Bands: < 0.4 exploring, < 0.75 developing, ≥ 0.75 confident **and** evidence_count ≥ 6. Parameters live in one SQL function so they can be tuned; a richer model (e.g. BKT) is a later decision (see DECISIONS D-009).
