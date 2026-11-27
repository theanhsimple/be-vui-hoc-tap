# little — Security & Row Level Security (Sprints 04–05)

> **Status:** implemented in `supabase/migrations/` and **verified on a local Supabase stack** (Supabase CLI 2.122.1, Postgres 17) with 41 automated tests through the public API as real signed-in users (`pnpm test:db`). **Not applied to any hosted Supabase project** — no project credentials were available (DECISIONS P-1).

## 1. Principles

1. **The database is the security boundary.** The web app is a convenience layer: every read runs as the signed-in guardian under RLS, and every write to child/learning data goes through a checked RPC.
2. **No service-role key in the app.** The Next.js server never holds `service_role` / secret keys (`src/lib/env.server.ts` has no such variable). Only the local test setup uses the local service key — to *create* test users — never to assert access.
3. **Deny by default.** Migration 2 revokes all table privileges from `anon`/`authenticated`, then grants back the minimum (often column-level). `auto_expose_new_tables = false` locally; migrations do not rely on it.
4. **Callers come from `auth.uid()`**, never from parameters. Ids from URLs, cookies or forms are filters, not proof of access.
5. **Fail closed, don't leak.** Unknown and foreign ids return the same `forbidden` error so ids cannot be probed.

## 2. Roles & authorization model

| Role | Where | Can |
|---|---|---|
| Parent (`family_members.role = 'owner'`) | per family | Everything on the family's children; rename family |
| Guardian (`'guardian'`) | per family | Same child access as owner. **Invitations not implemented** (schema ready) |
| Content Editor | `staff_roles` | Insert/update content columns (not status); `draft→in_review`, `archived→draft` |
| Content Reviewer | `staff_roles` | Read drafts; send `in_review→draft` |
| Publisher | `staff_roles` | `in_review→published`, `published→archived` |
| Admin | `staff_roles` | All staff permissions; grant/revoke staff roles; read audit log |

- Family roles and staff roles are **separate**: staff cannot read child data (tested), parents have no staff power.
- No role is self-assignable: `staff_roles` and `family_members` have **no** insert/update/delete grant; `grant_staff_role` requires admin. The first admin is bootstrapped with SQL by the database owner (`SUPABASE_SETUP.md` §6).

## 3. Helper functions (`private` schema)

`is_family_member(family)`, `is_family_owner(family)`, `can_access_child(child)`, `shares_family_with(user)`, `has_staff_role(role)` (admin implies all), `is_staff()`.

- `SECURITY DEFINER` so policies can consult membership without recursive RLS (a policy on `family_members` calling `family_members`).
- `set search_path = ''`, every name schema-qualified, `stable`, answer only about `auth.uid()`.
- `private` is **not** an exposed API schema; `authenticated`/`anon` get `USAGE` (required to call helpers from policies) but no table privileges there.

## 4. Policies (all tables have RLS enabled)

| Table | SELECT | Writes by clients |
|---|---|---|
| profiles | own row, or someone sharing a family | update own `display_name`, `locale` |
| families | active members | owner: update `display_name` |
| family_members | members of that family | **none** |
| guardian_consents | own rows; family owner | none |
| children | members of the child's family | update `nickname, avatar_key, birth_year, preferences, rewards_seen_at` of **active** children (not `family_id`, `status`) |
| staff_roles | own; admin | **none** |
| modules, skills, lessons, questions, rewards | `status='published'` (anon + authenticated); staff see drafts | editors: insert/update content columns; **status only via `set_content_status`** |
| lesson_questions | lesson AND question published; staff | editors insert/delete |
| learning_sessions, question_attempts, child_lesson_progress, skill_mastery, child_rewards, child_daily_plans, assessment_attempts | `can_access_child(child_id)` | **none** (RPC only) |
| child_module_progress (view, `security_invoker`) | inherits `child_lesson_progress` RLS | — |
| assessments, assessment_items | published: anon + authenticated (D-055); drafts: staff | none |
| assessment_runs (Sprint 05) | `can_access_child(child_id)` | **none** (RPC only) |
| family_invitations (Sprint 05) | owner of the family; **`code_hash` column not granted** | none (RPC only) |
| audit_logs | admin | none (written by definer functions) |
| content_publication_history | staff | none |
| `private.question_answer_keys`, `private.mastery_config` | **no grants, no policies** | — |

No policy uses `USING (true)` / `WITH CHECK (true)`.

## 5. Privileged operations (SECURITY DEFINER RPCs) — rationale

All: `set search_path = ''`; caller from `auth.uid()`; access check first; `EXECUTE` revoked from `PUBLIC`/`anon`, granted to `authenticated` only.

| Function | Why definer | Checks |
|---|---|---|
| `create_family(name, consent_version)` | Atomically writes `families` + owner `family_members` + `guardian_consents`; clients have no insert grant on these | signed in; consent version; one owned family per account (row-locked) |
| `create_child(family, …)` | Child + family link in one insert; enforces 6-child limit under concurrency | active member of that family; family row locked |
| `archive_child(child)` | Changes `status`, abandons open sessions; columns not client-writable | `can_access_child` |
| `start_session(child, lesson, restart)` | Writes `learning_sessions` | child access + active; lesson published and **unlocked for this child** (`child_lesson_states`); one open session per child+lesson (unique index) |
| `submit_attempt(session, question, response, key)` | Reads **private keys**, writes attempts, session totals, mastery, progress, rewards in one transaction | session belongs to an accessible child (row lock); child active; idempotency key; question must be the session's *current* question; attempt number counted server-side; response validated against public config |
| `request_hint(session, question)` | Reads `hint_eliminate` from private keys | same session/question checks; returns a **wrong** option only |
| `get_session_state / get_session_result / complete_session / abandon_session / get_active_session` | Return composed data incl. counts | child access |
| `get_student_overview(child)` | One round-trip view incl. progression computed with private rules | child access + active |
| `ensure_daily_plan(child, date, slugs)` | Writes `child_daily_plans` | child access; date within ±2 days; only published lessons |
| `grant_staff_role / revoke_staff_role` | Writes `staff_roles` | admin; cannot revoke own admin |
| `set_content_status(entity, id, status)` | Changes `status`, writes history + audit | transition matrix by staff role; publishing a question requires a consistent private key (`question_key_problem`) |
| `private.handle_new_user` (trigger) | Creates the `profiles` row on sign-up | copies a trimmed display name only |

## 6. Answer-key protection

- Keys live only in `private.question_answer_keys` (not exposed, no grants). Public `questions.config` holds options/items/cards — no `optionId`, `pairs`, `order`, `fills` (seed test + DB test + browser scan).
- Grading happens **inside** `submit_attempt`; the client never sends a score or attempt number.
- After a question is **finished and wrong**, the response includes `reveal` for that one question (learning-design decision D-040). Before that, nothing.
- Memory cards carry `pairKey` publicly (the child sees the faces anyway); the server still validates the submitted pairs against the private pairs (D-041).
- Verified: (a) `pnpm test:db` — keys unreachable through `schema('private')`, as a public table, or via private functions; (b) browser scan of 108 responses (HTML, RSC, JSON, JS) while opening four lessons — no key fields; (c) `.next` build output contains no key data or the keys marker (the demo keys module is used only by the seed generator and tests).

## 7. Web layer

- **Sessions:** Supabase Auth via `@supabase/ssr`; tokens in **httpOnly**, `SameSite=Lax`, `Secure` (production) cookies. No browser Supabase client, nothing in `localStorage` (verified). `src/proxy.ts` refreshes sessions with `getClaims()` (verifies the JWT) and redirects signed-out users away from `/student` and `/parent`. Pages and Server Functions check again (`requireUser`, `requireFamily`, `requireStudent`).
- **Selected child:** httpOnly cookie `little_child` holding a child id, re-validated under RLS on every request; a foreign or archived id is ignored (verified with a tampered cookie). Learning actions additionally pin each session to the selected child.
- **Server Functions** validate input with Zod and never accept family ids, child ids (except profile selection, which is RLS-checked), scores or attempt numbers.
- **Redirects:** `safeNextPath` allows only same-site relative paths (unit-tested; `//evil.example` verified in the browser to land on `/parent`).
- **Account enumeration:** sign-up and password reset show the same message whether or not an account exists.
- **Email links:** `/auth/callback` exchanges PKCE codes / OTP hashes; recovery links are single-use (verified).

### Sprint 05 additions

| Function | Checks |
|---|---|
| `get_child_report`, `get_assessment_summary`, `get_active_assessment` | `assert_child_access` (archived children allowed for reports) |
| `start_assessment`, `submit_assessment_item` | child access + active child; run locked `FOR UPDATE`; question must be the run's current item; graded with the private key; **returns no correctness**; idempotency key replay |
| `restore_child` | member; family row locked for the 6-child limit |
| `delete_child`, `delete_family`, `create_family_invite`, `revoke_family_invite`, `remove_family_member` | **owner** of the caller's own family (never a family id from the client); typed confirmations |
| `accept_family_invite` | consent version; caller in no family; code compared by SHA-256 hash, row locked; one generic `invite_invalid` |
| `export_family_data` | caller's own active membership; no answer keys; only the caller's email |
| `delete_my_account` | confirmation; deletes only `auth.uid()`'s `auth.users` row |

## 8. Test evidence (executed, local stack)

`test/db/isolation.test.ts` (24) and `test/db/learning-engine.test.ts` (17) — **41/41 passed**. Two families (A: A1, A2; B: B1) plus an unrelated signed-in user:

| # | Requirement | Result |
|---|---|---|
| 1 | Parent A can access A1 and A2 | ✅ |
| 2 | Parent A cannot access B1 | ✅ (select empty; RPC `forbidden`) |
| 3 | Parent B cannot access A1/A2 | ✅ |
| 4 | Parent A cannot modify B1 | ✅ (0 rows; archive/create-in-B `forbidden`; `family_id` not updatable) |
| 5 | Parent A cannot read B's sessions | ✅ (all child tables empty; RPC `forbidden`) |
| 6 | Parent A cannot modify B's attempts | ✅ (insert/update/delete `42501`; submit/abandon/complete `forbidden`) |
| 7 | Parent A cannot read answer keys | ✅ |
| 8 | Anonymous cannot access private data | ✅ (tables + RPCs) |
| 9 | No self-granted admin | ✅ (insert + RPC refused; membership/role writes refused; no publishing) |
| 10 | Modified child id doesn't bypass | ✅ (RPCs; random ids give the same error) + browser cookie tamper ✅ |
| 11 | Duplicate submissions | ✅ (same key → same attempt, `replayed`; 6 concurrent → 1 attempt, index +1) |
| 12 | Duplicate rewards | ✅ (4 concurrent completes + replay → 1 grant) |

Sprint 05: `test/db/parent-experience.test.ts` (11) — placement (no correctness returned, idempotent replay, skip/malformed answers refused, resume/restart, other family + anon refused, published content public but runs/answers private), child report (own family only), invitations (consent, one use, normalised codes, invalid/forged codes, hash unreadable, guardian cannot invite/delete/remove, removal revokes access immediately, open-invite limit, revoke, other family cannot see/revoke, already-in-family), export (only own family, no other family's ids/emails, anon refused), deletion (wrong name refused, other family's owner refused, every child table verified empty by owner-level count, other family untouched), account deletion (auth user + profile + family gone), restore/permanent child deletion. **All 54 DB tests pass (43 + 11).**

## 9. Known limitations / not done

- Not tested on hosted Supabase; email delivery uses the local Mailpit catcher (production SMTP not configured).
- No CAPTCHA or app-level rate limiting beyond Supabase Auth's built-in limits.
- Consent withdrawal has no separate flow: withdrawing = deleting data (documented in the draft privacy page).
- Invitation codes travel outside the app (the owner shares them); no email invitations until an email provider exists (P-1).
- The break reminder (S10) is a per-tab nudge, not an enforced limit (D-054).
- No MFA for staff accounts yet (recommended before the admin CMS ships).
- Memory-game pairing is inherently visible on the device (D-041).
- Supabase's own advisors/linter were not run against a hosted project.
