-- little — Sprint 04 — security: RLS, grants, authorization helpers
--
-- Model (docs/SECURITY_AND_RLS.md):
--   * Every table has RLS enabled. Nothing is granted by default.
--   * Family/child data: readable by ACTIVE members of the child's family only.
--   * Child learning data is never written directly by clients: only through
--     SECURITY DEFINER RPCs (20261122000300) that check access first.
--   * Published content is public (readable by anon + authenticated); drafts
--     are visible to staff only. Answer keys live in `private` and are never
--     granted to API roles.
--   * Roles cannot be self-assigned: staff_roles and family_members have no
--     write grants at all.

-- ── Lock down defaults ──────────────────────────────────────────────────

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

-- Policies call the helpers below, which requires USAGE on the schema.
-- `private` is not in the Data API's exposed schemas, and no table in it is
-- granted, so USAGE alone exposes nothing.
grant usage on schema private to authenticated, anon;

-- ── Authorization helpers ───────────────────────────────────────────────
-- SECURITY DEFINER so they can read membership tables without recursing
-- into those tables' own RLS policies. Fixed empty search_path; every
-- reference is schema-qualified; they only answer about auth.uid() itself.

create function private.is_family_member(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = p_family_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create function private.is_family_owner(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = p_family_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = 'owner'
  );
$$;

create function private.can_access_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children c
    join public.family_members m on m.family_id = c.family_id
    where c.id = p_child_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create function private.shares_family_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_members a
    join public.family_members b on b.family_id = a.family_id
    where a.user_id = (select auth.uid()) and a.status = 'active'
      and b.user_id = p_user_id and b.status = 'active'
  );
$$;

-- Admin implies every staff permission.
create function private.has_staff_role(p_role public.staff_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_roles r
    where r.user_id = (select auth.uid())
      and (r.role = p_role or r.role = 'admin')
  );
$$;

create function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff_roles r where r.user_id = (select auth.uid()));
$$;

revoke all on function private.is_family_member(uuid) from public;
revoke all on function private.is_family_owner(uuid) from public;
revoke all on function private.can_access_child(uuid) from public;
revoke all on function private.shares_family_with(uuid) from public;
revoke all on function private.has_staff_role(public.staff_role) from public;
revoke all on function private.is_staff() from public;
grant execute on function private.is_family_member(uuid) to authenticated;
grant execute on function private.is_family_owner(uuid) to authenticated;
grant execute on function private.can_access_child(uuid) to authenticated;
grant execute on function private.shares_family_with(uuid) to authenticated;
grant execute on function private.has_staff_role(public.staff_role) to authenticated, anon;
grant execute on function private.is_staff() to authenticated, anon;

-- ── Enable RLS everywhere ───────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.guardian_consents enable row level security;
alter table public.children enable row level security;
alter table public.staff_roles enable row level security;
alter table public.modules enable row level security;
alter table public.skills enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.lesson_questions enable row level security;
alter table public.rewards enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.child_lesson_progress enable row level security;
alter table public.skill_mastery enable row level security;
alter table public.child_rewards enable row level security;
alter table public.child_daily_plans enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_items enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.audit_logs enable row level security;
alter table public.content_publication_history enable row level security;
alter table private.question_answer_keys enable row level security;
alter table private.mastery_config enable row level security;
-- No policies on private.* tables: only table owners / definer functions read them.

-- ── Identity & family ───────────────────────────────────────────────────

grant select on public.profiles to authenticated;
grant update (display_name, locale) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_family_with(id));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select on public.families to authenticated;
grant update (display_name) on public.families to authenticated;
create policy families_select on public.families for select to authenticated
  using (private.is_family_member(id));
create policy families_update_owner on public.families for update to authenticated
  using (private.is_family_owner(id)) with check (private.is_family_owner(id));
-- INSERT/DELETE: none. Families are created by create_family() only.

grant select on public.family_members to authenticated;
create policy family_members_select on public.family_members for select to authenticated
  using (private.is_family_member(family_id));
-- No INSERT/UPDATE/DELETE grant: membership and roles cannot be self-assigned.

grant select on public.guardian_consents to authenticated;
create policy guardian_consents_select on public.guardian_consents for select to authenticated
  using (user_id = (select auth.uid()) or private.is_family_owner(family_id));

grant select on public.children to authenticated;
-- family_id, status, archived_at are NOT updatable by clients (no moving a
-- child to another family; archiving goes through archive_child()).
grant update (nickname, avatar_key, birth_year, preferences, rewards_seen_at) on public.children to authenticated;
create policy children_select on public.children for select to authenticated
  using (private.is_family_member(family_id));
create policy children_update on public.children for update to authenticated
  using (private.is_family_member(family_id) and status = 'active')
  with check (private.is_family_member(family_id));
-- INSERT: create_child() only (validates membership + limits atomically).

grant select on public.staff_roles to authenticated;
create policy staff_roles_select on public.staff_roles for select to authenticated
  using (user_id = (select auth.uid()) or private.has_staff_role('admin'));
-- No write grants: grant_staff_role() (admin only) is the only path.

-- ── Content ─────────────────────────────────────────────────────────────
-- Published content: public. Drafts: staff. Editors may write content
-- columns, but NOT status/published_at (publishing is set_content_status()).

grant select on public.modules, public.skills, public.lessons, public.questions,
  public.lesson_questions, public.rewards to anon, authenticated;

create policy modules_select on public.modules for select to anon, authenticated
  using (status = 'published' or private.is_staff());
create policy skills_select on public.skills for select to anon, authenticated
  using (status = 'published' or private.is_staff());
create policy lessons_select on public.lessons for select to anon, authenticated
  using (status = 'published' or private.is_staff());
create policy questions_select on public.questions for select to anon, authenticated
  using (status = 'published' or private.is_staff());
create policy rewards_select on public.rewards for select to anon, authenticated
  using (status = 'published' or private.is_staff());
create policy lesson_questions_select on public.lesson_questions for select to anon, authenticated
  using (
    private.is_staff()
    or (
      exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
      and exists (select 1 from public.questions q where q.id = question_id and q.status = 'published')
    )
  );

grant insert (slug, title_vi, title_en, category, description, tone, illustration, sort_order, unlock_min_completed_lessons),
  update (title_vi, title_en, category, description, tone, illustration, sort_order, unlock_min_completed_lessons)
  on public.modules to authenticated;
grant insert (module_id, slug, title_vi, sort_order), update (title_vi, sort_order)
  on public.skills to authenticated;
grant insert (skill_id, slug, title_vi, objective_vi, minutes, cover, sort_order),
  update (title_vi, objective_vi, minutes, cover, sort_order)
  on public.lessons to authenticated;
grant insert (skill_id, slug, type, difficulty, prompt_vi, instruction_audio_url, stimulus, memorize, feedback, config, max_attempts),
  update (difficulty, prompt_vi, instruction_audio_url, stimulus, memorize, feedback, config, max_attempts)
  on public.questions to authenticated;
grant insert, delete on public.lesson_questions to authenticated;

create policy modules_editor_insert on public.modules for insert to authenticated
  with check (private.has_staff_role('content_editor'));
create policy modules_editor_update on public.modules for update to authenticated
  using (private.has_staff_role('content_editor')) with check (private.has_staff_role('content_editor'));
create policy skills_editor_insert on public.skills for insert to authenticated
  with check (private.has_staff_role('content_editor'));
create policy skills_editor_update on public.skills for update to authenticated
  using (private.has_staff_role('content_editor')) with check (private.has_staff_role('content_editor'));
create policy lessons_editor_insert on public.lessons for insert to authenticated
  with check (private.has_staff_role('content_editor'));
create policy lessons_editor_update on public.lessons for update to authenticated
  using (private.has_staff_role('content_editor')) with check (private.has_staff_role('content_editor'));
create policy questions_editor_insert on public.questions for insert to authenticated
  with check (private.has_staff_role('content_editor'));
create policy questions_editor_update on public.questions for update to authenticated
  using (private.has_staff_role('content_editor')) with check (private.has_staff_role('content_editor'));
create policy lesson_questions_editor_insert on public.lesson_questions for insert to authenticated
  with check (private.has_staff_role('content_editor'));
create policy lesson_questions_editor_delete on public.lesson_questions for delete to authenticated
  using (private.has_staff_role('content_editor'));

-- ── Child learning data: read-only for the child's family ───────────────

grant select on public.learning_sessions, public.question_attempts, public.child_lesson_progress,
  public.skill_mastery, public.child_rewards, public.child_daily_plans, public.assessment_attempts
  to authenticated;
grant select on public.child_module_progress to authenticated;

create policy learning_sessions_select on public.learning_sessions for select to authenticated
  using (private.can_access_child(child_id));
create policy question_attempts_select on public.question_attempts for select to authenticated
  using (private.can_access_child(child_id));
create policy child_lesson_progress_select on public.child_lesson_progress for select to authenticated
  using (private.can_access_child(child_id));
create policy skill_mastery_select on public.skill_mastery for select to authenticated
  using (private.can_access_child(child_id));
create policy child_rewards_select on public.child_rewards for select to authenticated
  using (private.can_access_child(child_id));
create policy child_daily_plans_select on public.child_daily_plans for select to authenticated
  using (private.can_access_child(child_id));
create policy assessment_attempts_select on public.assessment_attempts for select to authenticated
  using (private.can_access_child(child_id));
-- No INSERT/UPDATE/DELETE grants: writes happen inside the learning RPCs.

-- ── Assessment content (prepared): staff only until an experience exists ─

grant select on public.assessments, public.assessment_items to authenticated;
create policy assessments_select on public.assessments for select to authenticated
  using (private.is_staff());
create policy assessment_items_select on public.assessment_items for select to authenticated
  using (private.is_staff());

-- ── Audit ───────────────────────────────────────────────────────────────

grant select on public.audit_logs, public.content_publication_history to authenticated;
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (private.has_staff_role('admin'));
create policy content_publication_history_select on public.content_publication_history
  for select to authenticated using (private.is_staff());
