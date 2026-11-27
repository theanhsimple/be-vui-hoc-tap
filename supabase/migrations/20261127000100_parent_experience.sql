-- little — Sprint 05 — parent experience
--
-- Additive only (no drops of tables, columns or data):
--   * skill texts for parents (summary + at-home activity),
--   * placement assessment runs (+ run link on the still-unused attempts table),
--   * guardian invitations (hashed one-time codes),
--   * RPCs: child report, assessment play/summary, restore/delete child,
--     invitations & membership, family data export, family/account deletion.
-- Same rules as 20261122000300: SECURITY DEFINER + search_path = '', caller
-- from auth.uid(), access checked first, execute granted to authenticated only.

-- ── Skill texts for parents ─────────────────────────────────────────────

alter table public.skills
  add column parent_summary_vi text not null default '' check (char_length(parent_summary_vi) <= 300),
  add column home_activity_vi text not null default '' check (char_length(home_activity_vi) <= 300);
grant insert (parent_summary_vi, home_activity_vi), update (parent_summary_vi, home_activity_vi)
  on public.skills to authenticated; -- editor-only through the existing skills policies

-- ── Assessment runs ─────────────────────────────────────────────────────

alter table public.assessments
  add column intro_vi text not null default '' check (char_length(intro_vi) <= 400);

create table public.assessment_runs (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete restrict,
  child_id uuid not null references public.children (id) on delete cascade,
  status public.session_status not null default 'in_progress',
  current_index smallint not null default 0 check (current_index >= 0),
  total_items smallint not null check (total_items between 1 and 100),
  started_by uuid references public.profiles (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint assessment_runs_index_bound check (current_index <= total_items),
  constraint assessment_runs_completed check ((status = 'completed') = (completed_at is not null)),
  constraint assessment_runs_abandoned check ((status = 'abandoned') = (abandoned_at is not null))
);
create unique index assessment_runs_one_active on public.assessment_runs (child_id, assessment_id)
  where status = 'in_progress';
create index assessment_runs_child_idx on public.assessment_runs (child_id, started_at desc);
create trigger set_updated_at before update on public.assessment_runs
  for each row execute function private.set_updated_at();

-- assessment_attempts had no write path before this migration, so it is
-- empty; a NOT NULL column fails loudly (instead of guessing) if it is not.
alter table public.assessment_attempts
  add column run_id uuid not null references public.assessment_runs (id) on delete cascade,
  add constraint assessment_attempts_one_per_item unique (run_id, question_id);
create index assessment_attempts_run_idx on public.assessment_attempts (run_id);

alter table public.assessment_runs enable row level security;
grant select on public.assessment_runs to authenticated;
create policy assessment_runs_select on public.assessment_runs for select to authenticated
  using (private.can_access_child(child_id));

-- Published placement activities are public content like lessons (D-044):
-- they only list public question ids. Drafts stay staff-only.
grant select on public.assessments, public.assessment_items to anon;
create policy assessments_select_published on public.assessments for select to anon, authenticated
  using (status = 'published');
create policy assessment_items_select_published on public.assessment_items for select to anon, authenticated
  using (
    exists (select 1 from public.assessments a where a.id = assessment_id and a.status = 'published')
    and exists (select 1 from public.questions q where q.id = question_id and q.status = 'published')
  );

-- ── Guardian invitations ────────────────────────────────────────────────
-- Only a SHA-256 hash of the code is stored; the code itself is shown once.

create table public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index family_invitations_family_idx on public.family_invitations (family_id, created_at desc);

alter table public.family_invitations enable row level security;
-- code_hash is deliberately NOT granted.
grant select (id, family_id, created_by, created_at, expires_at, accepted_by, accepted_at, revoked_at)
  on public.family_invitations to authenticated;
create policy family_invitations_select_owner on public.family_invitations for select to authenticated
  using (private.is_family_owner(family_id));

-- ── Internal helpers ────────────────────────────────────────────────────

-- The caller's active family membership (one family per account), or null.
create function private.my_membership()
returns public.family_members
language sql
stable
set search_path = ''
as $$
  select m.* from public.family_members m
  where m.user_id = auth.uid() and m.status = 'active'
  order by (m.role = 'owner') desc
  limit 1;
$$;

create function private.invite_code_hash(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'UTF8')), 'hex');
$$;

-- Observation band for a share of items done right (never shown as a score).
create function private.observation_band(p_correct integer, p_items integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_items <= 0 then 'not_started'
    when p_correct = p_items then 'confident'
    when p_correct * 2 >= p_items then 'developing'
    else 'exploring'
  end;
$$;

create function private.assessment_question_at(p_assessment_id uuid, p_index integer)
returns public.questions
language sql
stable
set search_path = ''
as $$
  select q.*
  from public.assessment_items ai
  join public.questions q on q.id = ai.question_id
  where ai.assessment_id = p_assessment_id and q.status = 'published'
  order by ai.position
  offset greatest(p_index, 0) limit 1;
$$;

create function private.assessment_run_state(p_run_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'runId', r.id,
    'assessmentId', a.slug,
    'status', r.status,
    'currentIndex', r.current_index,
    'total', r.total_items,
    'startedAt', r.started_at
  )
  from public.assessment_runs r
  join public.assessments a on a.id = r.assessment_id
  where r.id = p_run_id;
$$;

-- Observations of one completed run, grouped by learning world.
create function private.assessment_summary(p_run_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'runId', r.id,
    'assessmentId', a.slug,
    'title', a.title_vi,
    'startedAt', r.started_at,
    'completedAt', r.completed_at,
    'items', r.total_items,
    'modules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'moduleId', x.slug,
        'items', x.items,
        'correct', x.correct,
        'band', private.observation_band(x.correct, x.items)
      ) order by x.sort_order)
      from (
        select m.slug, m.sort_order, count(*)::integer as items,
               count(*) filter (where aa.is_correct)::integer as correct
        from public.assessment_attempts aa
        join public.questions q on q.id = aa.question_id
        join public.skills s on s.id = q.skill_id
        join public.modules m on m.id = s.module_id
        where aa.run_id = r.id
        group by m.slug, m.sort_order
      ) x
    ), '[]'::jsonb)
  )
  from public.assessment_runs r
  join public.assessments a on a.id = r.assessment_id
  where r.id = p_run_id and r.status = 'completed';
$$;

-- ── Child report (parent dashboard) ─────────────────────────────────────
-- Time is ESTIMATED from activity: gaps between a session's start and its
-- answers, each capped at 3 minutes, so a tab left open does not count.

create function public.get_child_report(p_child_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id, false);
  v_tz constant text := 'Asia/Ho_Chi_Minh';
  v_today date := (now() at time zone v_tz)::date;
  v_result jsonb;
begin
  with gaps as (
    select s.id as session_id,
      least(extract(epoch from (a.created_at - coalesce(
        lag(a.created_at) over (partition by s.id order by a.created_at), s.started_at))), 180) as secs,
      a.created_at
    from public.learning_sessions s
    join public.question_attempts a on a.session_id = s.id
    where s.child_id = v_child.id
  ),
  per_session as (
    select session_id, greatest(sum(secs), 0)::integer as active_seconds from gaps group by session_id
  ),
  per_day as (
    select (g.created_at at time zone v_tz)::date as day,
           count(distinct g.session_id)::integer as sessions,
           greatest(sum(g.secs), 0)::integer as seconds
    from gaps g
    where (g.created_at at time zone v_tz)::date > v_today - 7
    group by 1
  )
  select jsonb_build_object(
    'child', jsonb_build_object('id', v_child.id, 'nickname', v_child.nickname, 'status', v_child.status),
    'totals', jsonb_build_object(
      'sessionsCompleted', (select count(*) from public.learning_sessions s
                            where s.child_id = v_child.id and s.status = 'completed'),
      'activeSeconds', coalesce((select sum(active_seconds) from per_session), 0),
      'lessonsCompleted', (select count(*) from public.child_lesson_progress p where p.child_id = v_child.id),
      'stars', coalesce((select sum(best_stars) from public.child_lesson_progress p where p.child_id = v_child.id), 0),
      'badges', (select count(*) from public.child_rewards r where r.child_id = v_child.id),
      'activeDays7', (select count(*) from per_day where sessions > 0)
    ),
    'last7', (
      select jsonb_agg(jsonb_build_object(
        'date', d.day,
        'sessions', coalesce(pd.sessions, 0),
        'seconds', coalesce(pd.seconds, 0)
      ) order by d.day)
      from (select (v_today - i) as day from generate_series(0, 6) i) d
      left join per_day pd on pd.day = d.day
    ),
    'modules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'moduleId', m.slug,
        'total', (select count(*) from public.lessons l join public.skills s on s.id = l.skill_id
                  where s.module_id = m.id and l.status = 'published'),
        'completed', coalesce(cmp.completed_lessons, 0),
        'stars', coalesce(cmp.stars, 0),
        'lastAt', cmp.last_completed_at
      ) order by m.sort_order)
      from public.modules m
      left join public.child_module_progress cmp on cmp.module_id = m.id and cmp.child_id = v_child.id
      where m.status = 'published'
    ), '[]'::jsonb),
    'skills', coalesce((
      select jsonb_agg(jsonb_build_object(
        'skillId', s.slug,
        'state', coalesce(sm.state, 'not_started'),
        'accuracy', coalesce(sm.accuracy, 0),
        'evidence', coalesce(sm.evidence_count, 0),
        'sessions', coalesce(sm.session_count, 0),
        'lastPracticedAt', sm.last_practiced_at
      ) order by m.sort_order, s.sort_order)
      from public.skills s
      join public.modules m on m.id = s.module_id
      left join public.skill_mastery sm on sm.skill_id = s.id and sm.child_id = v_child.id
      where s.status = 'published' and m.status = 'published'
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(x.j order by x.completed_at desc)
      from (
        select s.completed_at, jsonb_build_object(
          'sessionId', s.id,
          'lessonId', l.slug,
          'completedAt', s.completed_at,
          'activeSeconds', coalesce(ps.active_seconds, 0),
          'correct', s.correct_count,
          'firstTry', s.first_try_count,
          'total', s.total_questions,
          'stars', coalesce(s.stars, 0)
        ) as j
        from public.learning_sessions s
        join public.lessons l on l.id = s.lesson_id
        left join per_session ps on ps.session_id = s.id
        where s.child_id = v_child.id and s.status = 'completed'
        order by s.completed_at desc
        limit 20
      ) x
    ), '[]'::jsonb),
    'assessment', (
      select private.assessment_summary(r.id)
      from public.assessment_runs r
      where r.child_id = v_child.id and r.status = 'completed'
      order by r.completed_at desc limit 1
    )
  ) into v_result;
  return v_result;
end;
$$;

-- ── Placement assessment ────────────────────────────────────────────────
-- One try per item, no correct/incorrect feedback to the child (it is an
-- observation, not a test). Does not change mastery, stars or rewards.

create function public.start_assessment(p_child_id uuid, p_assessment_slug text, p_restart boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id);
  v_assessment public.assessments;
  v_run uuid;
  v_total integer;
begin
  select a.* into v_assessment from public.assessments a
  where a.slug = p_assessment_slug and a.status = 'published';
  if not found then
    perform private.fail('assessment_not_found');
  end if;
  perform 1 from public.children c where c.id = v_child.id for update;

  select r.id into v_run from public.assessment_runs r
  where r.child_id = v_child.id and r.assessment_id = v_assessment.id and r.status = 'in_progress';
  if v_run is not null and p_restart then
    update public.assessment_runs set status = 'abandoned', abandoned_at = now() where id = v_run;
    v_run := null;
  end if;
  if v_run is not null then
    return private.assessment_run_state(v_run) || jsonb_build_object('resumed', true);
  end if;

  select count(*) into v_total
  from public.assessment_items ai join public.questions q on q.id = ai.question_id
  where ai.assessment_id = v_assessment.id and q.status = 'published';
  if v_total = 0 then
    perform private.fail('assessment_empty');
  end if;
  insert into public.assessment_runs (assessment_id, child_id, total_items, started_by)
  values (v_assessment.id, v_child.id, v_total, auth.uid())
  returning id into v_run;
  return private.assessment_run_state(v_run) || jsonb_build_object('resumed', false);
end;
$$;

create function public.get_active_assessment(p_child_id uuid, p_assessment_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id);
  v_run uuid;
begin
  select r.id into v_run
  from public.assessment_runs r join public.assessments a on a.id = r.assessment_id
  where r.child_id = v_child.id and a.slug = p_assessment_slug and r.status = 'in_progress';
  return case when v_run is null then null else private.assessment_run_state(v_run) end;
end;
$$;

-- Records one answer. Idempotent per (run, idempotency key). Returns no
-- correctness information.
create function public.submit_assessment_item(
  p_run_id uuid,
  p_question_slug text,
  p_response jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.assessment_runs;
  q public.questions;
  k private.question_answer_keys;
  g record;
begin
  perform private.require_uid();
  if p_idempotency_key is null then
    perform private.fail('idempotency_key_required');
  end if;
  select * into r from public.assessment_runs where id = p_run_id for update;
  if not found or not private.can_access_child(r.child_id) then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;

  if exists (select 1 from public.assessment_attempts aa
             where aa.run_id = r.id and aa.idempotency_key = p_idempotency_key) then
    return jsonb_build_object(
      'nextAction', case when r.current_index >= r.total_items then 'complete' else 'continue' end,
      'currentIndex', r.current_index,
      'replayed', true);
  end if;

  if r.status <> 'in_progress' then
    perform private.fail('run_not_active');
  end if;
  perform 1 from public.children c where c.id = r.child_id and c.status = 'active';
  if not found then
    perform private.fail('child_archived');
  end if;

  q := private.assessment_question_at(r.assessment_id, r.current_index);
  if q.id is null or q.slug <> p_question_slug then
    perform private.fail('question_mismatch');
  end if;
  select * into k from private.question_answer_keys where question_id = q.id;
  if not found then
    perform private.fail('question_unavailable');
  end if;
  select * into g from private.grade_response(q, k.answer, p_response);
  if not g.valid then
    perform private.fail('invalid_response');
  end if;

  insert into public.assessment_attempts
    (assessment_id, run_id, child_id, question_id, response, is_correct, idempotency_key)
  values (r.assessment_id, r.id, r.child_id, q.id, p_response, g.score = g.max_score, p_idempotency_key);

  update public.assessment_runs set
    current_index = current_index + 1,
    status = case when current_index + 1 >= total_items then 'completed'::public.session_status else status end,
    completed_at = case when current_index + 1 >= total_items then now() else completed_at end
  where id = r.id
  returning * into r;

  return jsonb_build_object(
    'nextAction', case when r.status = 'completed' then 'complete' else 'continue' end,
    'currentIndex', r.current_index,
    'replayed', false);
end;
$$;

-- Latest completed run of a child (or one given run of that child).
create function public.get_assessment_summary(p_child_id uuid, p_run_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id, false);
  v_run uuid;
begin
  select r.id into v_run from public.assessment_runs r
  where r.child_id = v_child.id and r.status = 'completed'
    and (p_run_id is null or r.id = p_run_id)
  order by r.completed_at desc limit 1;
  return case when v_run is null then null else private.assessment_summary(v_run) end;
end;
$$;

-- ── Children: restore & permanent deletion ──────────────────────────────

create function public.restore_child(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id, false);
begin
  if v_child.status = 'active' then
    return;
  end if;
  perform 1 from public.families f where f.id = v_child.family_id for update;
  if (select count(*) from public.children c where c.family_id = v_child.family_id and c.status = 'active') >= 6 then
    perform private.fail('child_limit');
  end if;
  update public.children set status = 'active', archived_at = null where id = p_child_id;
  perform private.audit('child.restore', 'child', p_child_id::text);
end;
$$;

-- Owner only, archived profiles only, nickname typed as confirmation.
-- Removes the child and ALL of its learning data (FK cascades).
create function public.delete_child(p_child_id uuid, p_confirm_nickname text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id, false);
begin
  if not private.is_family_owner(v_child.family_id) then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if v_child.status <> 'archived' then
    perform private.fail('child_not_archived');
  end if;
  if btrim(coalesce(p_confirm_nickname, '')) <> v_child.nickname then
    perform private.fail('confirmation_mismatch');
  end if;
  delete from public.children where id = p_child_id;
  perform private.audit('child.delete', 'child', p_child_id::text,
    jsonb_build_object('family_id', v_child.family_id));
end;
$$;

-- ── Invitations & membership ────────────────────────────────────────────

create function public.create_family_invite()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  m public.family_members := private.my_membership();
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 symbols, no 0/O/1/I
  v_bytes bytea := uuid_send(gen_random_uuid());
  v_pos integer[] := array[0, 1, 2, 3, 4, 5, 7, 9, 10, 11]; -- skips uuid version/variant bits
  v_code text := '';
  v_id uuid;
  v_expires timestamptz := now() + interval '7 days';
  i integer;
begin
  if m.family_id is null or m.role <> 'owner' then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  perform 1 from public.families f where f.id = m.family_id for update;
  if (select count(*) from public.family_invitations fi
      where fi.family_id = m.family_id and fi.accepted_at is null and fi.revoked_at is null
        and fi.expires_at > now()) >= 3 then
    perform private.fail('invite_limit');
  end if;
  foreach i in array v_pos loop
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  v_code := substr(v_code, 1, 5) || '-' || substr(v_code, 6, 5);
  insert into public.family_invitations (family_id, code_hash, created_by, expires_at)
  values (m.family_id, private.invite_code_hash(v_code), v_uid, v_expires)
  returning id into v_id;
  perform private.audit('family.invite', 'family', m.family_id::text, jsonb_build_object('invite_id', v_id));
  return jsonb_build_object('id', v_id, 'code', v_code, 'expiresAt', v_expires);
end;
$$;

create function public.revoke_family_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family uuid;
begin
  perform private.require_uid();
  select fi.family_id into v_family from public.family_invitations fi where fi.id = p_invite_id;
  if v_family is null or not private.is_family_owner(v_family) then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  update public.family_invitations set revoked_at = now()
  where id = p_invite_id and accepted_at is null and revoked_at is null;
end;
$$;

-- Joins the invited family as a guardian. Every failure that depends on the
-- code returns the same 'invite_invalid' so codes cannot be probed.
create function public.accept_family_invite(p_code text, p_consent_version text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  inv public.family_invitations;
begin
  if p_consent_version is null or p_consent_version !~ '^[a-z0-9.-]{1,32}$' then
    perform private.fail('consent_required');
  end if;
  perform 1 from public.profiles p where p.id = v_uid for update;
  if (private.my_membership()).family_id is not null then
    perform private.fail('already_in_family');
  end if;
  select * into inv from public.family_invitations fi
  where fi.code_hash = private.invite_code_hash(p_code)
  for update;
  if not found or inv.accepted_at is not null or inv.revoked_at is not null or inv.expires_at <= now() then
    perform private.fail('invite_invalid');
  end if;
  perform 1 from public.families f where f.id = inv.family_id and f.archived_at is null;
  if not found then
    perform private.fail('invite_invalid');
  end if;

  insert into public.family_members (family_id, user_id, role, status, invited_by)
  values (inv.family_id, v_uid, 'guardian', 'active', inv.created_by)
  on conflict (family_id, user_id) do update
    set role = 'guardian', status = 'active', invited_by = excluded.invited_by;
  insert into public.guardian_consents (family_id, user_id, consent_version)
  values (inv.family_id, v_uid, p_consent_version);
  update public.family_invitations set accepted_by = v_uid, accepted_at = now() where id = inv.id;
  perform private.audit('family.join', 'family', inv.family_id::text, jsonb_build_object('invite_id', inv.id));
  return inv.family_id;
end;
$$;

create function public.remove_family_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.family_members := private.my_membership();
begin
  perform private.require_uid();
  if m.family_id is null or m.role <> 'owner' then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if p_user_id = auth.uid() then
    perform private.fail('cannot_remove_owner');
  end if;
  update public.family_members set status = 'removed'
  where family_id = m.family_id and user_id = p_user_id and role = 'guardian' and status = 'active';
  if not found then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  perform private.audit('family.member_remove', 'family', m.family_id::text,
    jsonb_build_object('user_id', p_user_id));
end;
$$;

create function public.leave_family()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.family_members := private.my_membership();
begin
  perform private.require_uid();
  if m.family_id is null then
    return;
  end if;
  if m.role = 'owner' then
    perform private.fail('owner_cannot_leave');
  end if;
  update public.family_members set status = 'removed'
  where family_id = m.family_id and user_id = m.user_id;
  perform private.audit('family.leave', 'family', m.family_id::text);
end;
$$;

-- ── Data export ─────────────────────────────────────────────────────────
-- Everything the family holds, for any active member. No answer keys, no
-- other family's data, no other user's email.

create function public.export_family_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  m public.family_members := private.my_membership();
  v_family uuid := m.family_id;
begin
  return jsonb_build_object(
    'format', 'little-family-export',
    'version', 1,
    'exportedAt', now(),
    'account', (
      select jsonb_build_object('email', u.email, 'displayName', p.display_name, 'locale', p.locale,
                                'createdAt', p.created_at)
      from public.profiles p left join auth.users u on u.id = p.id where p.id = v_uid
    ),
    'family', (
      select jsonb_build_object('id', f.id, 'name', f.display_name, 'createdAt', f.created_at)
      from public.families f where f.id = v_family
    ),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('displayName', p.display_name, 'role', fm.role,
                                          'status', fm.status, 'since', fm.created_at))
      from public.family_members fm join public.profiles p on p.id = fm.user_id
      where fm.family_id = v_family
    ), '[]'::jsonb),
    'consents', coalesce((
      select jsonb_agg(jsonb_build_object('version', gc.consent_version, 'consentedAt', gc.consented_at,
                                          'withdrawnAt', gc.withdrawn_at, 'mine', gc.user_id = v_uid))
      from public.guardian_consents gc where gc.family_id = v_family
    ), '[]'::jsonb),
    'children', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'nickname', c.nickname,
        'avatar', c.avatar_key,
        'birthYear', c.birth_year,
        'preferences', c.preferences,
        'status', c.status,
        'createdAt', c.created_at,
        'archivedAt', c.archived_at,
        'sessions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', s.id, 'lesson', l.slug, 'status', s.status, 'startedAt', s.started_at,
            'completedAt', s.completed_at, 'abandonedAt', s.abandoned_at, 'correct', s.correct_count,
            'firstTry', s.first_try_count, 'total', s.total_questions, 'stars', s.stars,
            'attempts', coalesce((
              select jsonb_agg(jsonb_build_object(
                'question', q.slug, 'attemptNo', a.attempt_no, 'response', a.response,
                'isCorrect', a.is_correct, 'at', a.created_at) order by a.created_at)
              from public.question_attempts a join public.questions q on q.id = a.question_id
              where a.session_id = s.id
            ), '[]'::jsonb)
          ) order by s.started_at)
          from public.learning_sessions s join public.lessons l on l.id = s.lesson_id
          where s.child_id = c.id
        ), '[]'::jsonb),
        'lessonProgress', coalesce((
          select jsonb_agg(jsonb_build_object('lesson', l.slug, 'bestStars', p.best_stars,
            'completions', p.completions, 'firstCompletedAt', p.first_completed_at,
            'lastCompletedAt', p.last_completed_at))
          from public.child_lesson_progress p join public.lessons l on l.id = p.lesson_id
          where p.child_id = c.id
        ), '[]'::jsonb),
        'skillMastery', coalesce((
          select jsonb_agg(jsonb_build_object('skill', s.slug, 'state', sm.state, 'accuracy', sm.accuracy,
            'evidence', sm.evidence_count, 'lastPracticedAt', sm.last_practiced_at))
          from public.skill_mastery sm join public.skills s on s.id = sm.skill_id
          where sm.child_id = c.id
        ), '[]'::jsonb),
        'rewards', coalesce((
          select jsonb_agg(jsonb_build_object('reward', r.key, 'reason', cr.reason, 'grantedAt', cr.granted_at))
          from public.child_rewards cr join public.rewards r on r.id = cr.reward_id
          where cr.child_id = c.id
        ), '[]'::jsonb),
        'dailyPlans', coalesce((
          select jsonb_agg(jsonb_build_object('date', dp.plan_date, 'lessons', (
            select coalesce(jsonb_agg(l.slug), '[]'::jsonb) from public.lessons l where l.id = any (dp.lesson_ids))))
          from public.child_daily_plans dp where dp.child_id = c.id
        ), '[]'::jsonb),
        'assessments', coalesce((
          select jsonb_agg(jsonb_build_object(
            'assessment', a.slug, 'status', ar.status, 'startedAt', ar.started_at,
            'completedAt', ar.completed_at,
            'answers', coalesce((
              select jsonb_agg(jsonb_build_object('question', q.slug, 'response', aa.response,
                'isCorrect', aa.is_correct, 'at', aa.created_at) order by aa.created_at)
              from public.assessment_attempts aa join public.questions q on q.id = aa.question_id
              where aa.run_id = ar.id
            ), '[]'::jsonb)
          ) order by ar.started_at)
          from public.assessment_runs ar join public.assessments a on a.id = ar.assessment_id
          where ar.child_id = c.id
        ), '[]'::jsonb)
      ) order by c.created_at)
      from public.children c where c.family_id = v_family
    ), '[]'::jsonb)
  );
end;
$$;

-- ── Deletion ────────────────────────────────────────────────────────────
-- Owner deletes the whole family: children and all learning data, members,
-- consents and invitations go with it (FK cascades). Confirmation: the
-- family name typed exactly.

create function private.delete_family_internal(p_family_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_children integer;
begin
  select count(*) into v_children from public.children c where c.family_id = p_family_id;
  delete from public.families where id = p_family_id;
  perform private.audit('family.delete', 'family', p_family_id::text, jsonb_build_object('children', v_children));
end;
$$;

create function public.delete_family(p_confirm_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.family_members := private.my_membership();
  v_name text;
begin
  perform private.require_uid();
  if m.family_id is null or m.role <> 'owner' then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  select f.display_name into v_name from public.families f where f.id = m.family_id for update;
  if btrim(coalesce(p_confirm_name, '')) <> v_name then
    perform private.fail('confirmation_mismatch');
  end if;
  perform private.delete_family_internal(m.family_id);
end;
$$;

-- Deletes the caller's account. An owner's family is deleted with it (the
-- family name must be typed); a guardian only leaves. Without a family the
-- confirmation is the word XOA.
create function public.delete_my_account(p_confirm text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  m public.family_members := private.my_membership();
  v_name text;
begin
  if m.family_id is not null then
    select f.display_name into v_name from public.families f where f.id = m.family_id for update;
  end if;
  if btrim(coalesce(p_confirm, '')) <> coalesce(v_name, 'XOA') then
    perform private.fail('confirmation_mismatch');
  end if;
  if m.family_id is not null and m.role = 'owner' then
    perform private.delete_family_internal(m.family_id);
  end if;
  perform private.audit('account.delete', 'profile', v_uid::text);
  -- Cascades to profiles, memberships, consents and staff roles.
  delete from auth.users where id = v_uid;
end;
$$;

-- ── Execute grants: authenticated only ──────────────────────────────────

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_family_member(uuid) to authenticated;
grant execute on function private.is_family_owner(uuid) to authenticated;
grant execute on function private.can_access_child(uuid) to authenticated;
grant execute on function private.shares_family_with(uuid) to authenticated;
grant execute on function private.has_staff_role(public.staff_role) to authenticated, anon;
grant execute on function private.is_staff() to authenticated, anon;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.get_child_report(uuid)',
    'public.start_assessment(uuid, text, boolean)',
    'public.get_active_assessment(uuid, text)',
    'public.submit_assessment_item(uuid, text, jsonb, uuid)',
    'public.get_assessment_summary(uuid, uuid)',
    'public.restore_child(uuid)',
    'public.delete_child(uuid, text)',
    'public.create_family_invite()',
    'public.revoke_family_invite(uuid)',
    'public.accept_family_invite(text, text)',
    'public.remove_family_member(uuid)',
    'public.leave_family()',
    'public.export_family_data()',
    'public.delete_family(text)',
    'public.delete_my_account(text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;
