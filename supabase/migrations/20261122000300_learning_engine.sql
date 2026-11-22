-- little — Sprint 04 — learning engine & privileged operations
--
-- Every function that writes family/child/learning data is SECURITY DEFINER
-- (runs as the owner so it can write tables clients cannot), and therefore:
--   * sets search_path = '' and schema-qualifies every name,
--   * derives the caller from auth.uid() — never from a parameter,
--   * checks family/child access FIRST and fails closed,
--   * is executable by `authenticated` only (never anon / PUBLIC).
-- Rationale per function: docs/SECURITY_AND_RLS.md §5.
--
-- Errors: SQLSTATE 42501 + message 'not_authenticated' | 'forbidden';
--         SQLSTATE P0001 + a stable code in the message (see docs/API_CONTRACT.md).

-- ── Small internal helpers ──────────────────────────────────────────────

create function private.require_uid()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v uuid := auth.uid();
begin
  if v is null then
    raise exception using errcode = '42501', message = 'not_authenticated';
  end if;
  return v;
end;
$$;

create function private.fail(p_code text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = p_code;
end;
$$;

create function private.audit(p_action text, p_entity text, p_entity_id text, p_meta jsonb default '{}'::jsonb)
returns void
language sql
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_meta, '{}'::jsonb));
$$;

-- Access check used by every child-scoped RPC. Unknown and foreign children
-- produce the same error so ids cannot be probed.
create function private.assert_child_access(p_child_id uuid, p_require_active boolean default true)
returns public.children
language plpgsql
stable
set search_path = ''
as $$
declare
  v_child public.children;
begin
  perform private.require_uid();
  select c.* into v_child from public.children c where c.id = p_child_id;
  if not found or not private.can_access_child(p_child_id) then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if p_require_active and v_child.status <> 'active' then
    perform private.fail('child_archived');
  end if;
  return v_child;
end;
$$;

-- ── Family & children ───────────────────────────────────────────────────

-- Creates a family, the caller's OWNER membership and the consent record in
-- one transaction. Rule (Sprint 04): one owned family per account.
create function public.create_family(p_display_name text, p_consent_version text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_family uuid;
  v_name text := btrim(coalesce(p_display_name, ''));
begin
  if char_length(v_name) not between 1 and 60 then
    perform private.fail('invalid_name');
  end if;
  if p_consent_version is null or p_consent_version !~ '^[a-z0-9.-]{1,32}$' then
    perform private.fail('consent_required');
  end if;
  -- Serialise concurrent calls for the same user.
  perform 1 from public.profiles p where p.id = v_uid for update;
  if not found then
    perform private.fail('profile_missing');
  end if;
  if exists (
    select 1 from public.family_members m
    where m.user_id = v_uid and m.role = 'owner' and m.status = 'active'
  ) then
    perform private.fail('family_exists');
  end if;

  insert into public.families (display_name, created_by) values (v_name, v_uid)
  returning id into v_family;
  insert into public.family_members (family_id, user_id, role, status)
  values (v_family, v_uid, 'owner', 'active');
  insert into public.guardian_consents (family_id, user_id, consent_version)
  values (v_family, v_uid, p_consent_version);
  perform private.audit('family.create', 'family', v_family::text);
  return v_family;
end;
$$;

-- Creates a child inside a family the caller is an active member of. The
-- family link is part of the same insert (atomic).
create function public.create_child(
  p_family_id uuid,
  p_nickname text,
  p_avatar_key text,
  p_birth_year smallint default null,
  p_preferences jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_child uuid;
  v_count integer;
begin
  if not private.is_family_member(p_family_id) then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  -- Serialise child creation per family so the limit holds under concurrency.
  perform 1 from public.families f where f.id = p_family_id and f.archived_at is null for update;
  if not found then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  select count(*) into v_count from public.children c
  where c.family_id = p_family_id and c.status = 'active';
  if v_count >= 6 then
    perform private.fail('child_limit');
  end if;

  begin
    insert into public.children (family_id, nickname, avatar_key, birth_year, preferences, created_by)
    values (p_family_id, btrim(p_nickname), p_avatar_key, p_birth_year, coalesce(p_preferences, '{}'::jsonb), v_uid)
    returning id into v_child;
  exception when check_violation or not_null_violation then
    perform private.fail('invalid_child');
  end;
  perform private.audit('child.create', 'child', v_child::text, jsonb_build_object('family_id', p_family_id));
  return v_child;
end;
$$;

-- Archive (not delete): learning history is kept for the family; the child
-- disappears from profile selection and any open session is abandoned.
create function public.archive_child(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id, false);
begin
  if v_child.status = 'archived' then
    return; -- idempotent
  end if;
  update public.children set status = 'archived', archived_at = now() where id = p_child_id;
  update public.learning_sessions set status = 'abandoned', abandoned_at = now()
  where child_id = p_child_id and status = 'in_progress';
  perform private.audit('child.archive', 'child', p_child_id::text);
end;
$$;

-- ── Progression (single source of truth, D-031) ─────────────────────────
-- locked | available | completed for every published lesson, for one child.

create function private.child_lesson_states(p_child_id uuid)
returns table (lesson_id uuid, module_id uuid, state text)
language sql
stable
set search_path = ''
as $$
  with done as (
    select clp.lesson_id from public.child_lesson_progress clp where clp.child_id = p_child_id
  ),
  total_done as (select count(*)::integer as n from done),
  ls as (
    select
      l.id,
      s.module_id,
      m.unlock_min_completed_lessons as unlock_after,
      lag(l.id) over (partition by l.skill_id order by l.sort_order, l.slug) as prev_id
    from public.lessons l
    join public.skills s on s.id = l.skill_id
    join public.modules m on m.id = s.module_id
    where l.status = 'published' and s.status = 'published' and m.status = 'published'
  )
  select
    ls.id,
    ls.module_id,
    case
      when ls.id in (select d.lesson_id from done d) then 'completed'
      when ls.unlock_after is not null and (select n from total_done) < ls.unlock_after then 'locked'
      when ls.prev_id is null or ls.prev_id in (select d.lesson_id from done d) then 'available'
      else 'locked'
    end
  from ls;
$$;

-- ── Grading (server-side, keys never leave the database) ────────────────

create function private.text_array(p jsonb, p_field text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(e ->> p_field), '{}') from jsonb_array_elements(p) e;
$$;

-- Validates the response against the question's PUBLIC config and scores it
-- against the PRIVATE key. valid=false means a malformed/foreign response.
-- Partial credit is reported in score/max_score; a question counts as
-- correct only when score = max_score.
create function private.grade_response(
  p_question public.questions,
  p_answer jsonb,
  p_response jsonb,
  out valid boolean,
  out score numeric,
  out max_score numeric
)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_type text := p_question.type::text;
  v_cfg jsonb := p_question.config;
  v_ids text[];
  v_left text[];
  v_right text[];
  v_n integer;
  v_blanks integer;
begin
  valid := false;
  score := 0;
  max_score := 1;
  if jsonb_typeof(p_response) is distinct from 'object' or (p_response ->> 'type') is distinct from v_type then
    return;
  end if;

  if v_type in ('single_choice', 'image_choice') then
    if jsonb_typeof(p_response -> 'optionId') is distinct from 'string' then return; end if;
    v_ids := private.text_array(v_cfg -> 'options', 'id');
    if not ((p_response ->> 'optionId') = any (v_ids)) then return; end if;
    valid := true;
    max_score := 1;
    score := case when (p_response ->> 'optionId') = (p_answer ->> 'optionId') then 1 else 0 end;

  elsif v_type in ('matching', 'memory') then
    if jsonb_typeof(p_response -> 'pairs') is distinct from 'array' then return; end if;
    v_n := jsonb_array_length(p_response -> 'pairs');
    if v_n < 1 or v_n > 20 then return; end if;
    if exists (
      select 1 from jsonb_array_elements(p_response -> 'pairs') e
      where case
        when jsonb_typeof(e) = 'array' and jsonb_array_length(e) = 2 then
          jsonb_typeof(e -> 0) is distinct from 'string' or jsonb_typeof(e -> 1) is distinct from 'string'
        else true
      end
    ) then return; end if;

    if v_type = 'matching' then
      v_left := private.text_array(v_cfg -> 'left', 'id');
      v_right := private.text_array(v_cfg -> 'right', 'id');
      if exists (
        select 1 from jsonb_array_elements(p_response -> 'pairs') e
        where not ((e ->> 0) = any (v_left)) or not ((e ->> 1) = any (v_right))
      ) then return; end if;
      -- each left and each right used at most once
      if (select count(distinct e ->> 0) from jsonb_array_elements(p_response -> 'pairs') e) <> v_n
        or (select count(distinct e ->> 1) from jsonb_array_elements(p_response -> 'pairs') e) <> v_n
      then return; end if;
      valid := true;
      max_score := jsonb_array_length(p_answer -> 'pairs');
      score := (
        select count(*) from jsonb_array_elements(p_response -> 'pairs') e
        where exists (
          select 1 from jsonb_array_elements(p_answer -> 'pairs') k
          where (k ->> 0) = (e ->> 0) and (k ->> 1) = (e ->> 1)
        )
      );
    else
      -- memory: the finished board. Every card used exactly once; each pair
      -- must be a real pair from the PRIVATE key (client score is ignored).
      v_ids := private.text_array(v_cfg -> 'cards', 'id');
      if exists (
        select 1 from jsonb_array_elements(p_response -> 'pairs') e
        where not ((e ->> 0) = any (v_ids)) or not ((e ->> 1) = any (v_ids))
      ) then return; end if;
      if (
        select count(distinct c) from (
          select e ->> 0 as c from jsonb_array_elements(p_response -> 'pairs') e
          union all
          select e ->> 1 from jsonb_array_elements(p_response -> 'pairs') e
        ) x
      ) <> v_n * 2 then return; end if;
      if p_response ? 'moves' and (
        jsonb_typeof(p_response -> 'moves') is distinct from 'number'
        or (p_response ->> 'moves')::numeric not between 0 and 500
      ) then return; end if;
      valid := true;
      max_score := jsonb_array_length(p_answer -> 'pairs');
      score := (
        select count(*) from jsonb_array_elements(p_response -> 'pairs') e
        where exists (
          select 1 from jsonb_array_elements(p_answer -> 'pairs') k
          where ((k ->> 0) = (e ->> 0) and (k ->> 1) = (e ->> 1))
             or ((k ->> 0) = (e ->> 1) and (k ->> 1) = (e ->> 0))
        )
      );
    end if;

  elsif v_type = 'ordering' then
    if jsonb_typeof(p_response -> 'order') is distinct from 'array' then return; end if;
    v_ids := private.text_array(v_cfg -> 'items', 'id');
    v_n := jsonb_array_length(p_response -> 'order');
    if v_n <> cardinality(v_ids) then return; end if;
    if exists (
      select 1 from jsonb_array_elements(p_response -> 'order') e
      where jsonb_typeof(e) is distinct from 'string' or not ((e #>> '{}') = any (v_ids))
    ) then return; end if;
    if (select count(distinct e #>> '{}') from jsonb_array_elements(p_response -> 'order') e) <> v_n then
      return;
    end if;
    valid := true;
    max_score := jsonb_array_length(p_answer -> 'order');
    score := (
      select count(*) from jsonb_array_elements(p_response -> 'order') with ordinality r(v, i)
      join jsonb_array_elements(p_answer -> 'order') with ordinality k(v, i) on k.i = r.i
      where (k.v #>> '{}') = (r.v #>> '{}')
    );

  elsif v_type = 'pattern' then
    if jsonb_typeof(p_response -> 'fills') is distinct from 'array' then return; end if;
    v_ids := private.text_array(v_cfg -> 'palette', 'id');
    select count(*) into v_blanks from jsonb_array_elements(v_cfg -> 'sequence') e where jsonb_typeof(e) = 'null';
    if jsonb_array_length(p_response -> 'fills') <> v_blanks then return; end if;
    if exists (
      select 1 from jsonb_array_elements(p_response -> 'fills') e
      where jsonb_typeof(e) is distinct from 'string' or not ((e #>> '{}') = any (v_ids))
    ) then return; end if;
    valid := true;
    max_score := jsonb_array_length(p_answer -> 'fills');
    score := (
      select count(*) from jsonb_array_elements(p_response -> 'fills') with ordinality r(v, i)
      join jsonb_array_elements(p_answer -> 'fills') with ordinality k(v, i) on k.i = r.i
      where (k.v #>> '{}') = (r.v #>> '{}')
    );
  end if;

  if max_score <= 0 then
    valid := false;
  end if;
end;
$$;

-- What the child may see after a question is FINISHED and was wrong
-- (learning-design decision D-040): the correct answer for that one question.
create function private.reveal_for(p_type public.question_type, p_answer jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when p_type in ('single_choice', 'image_choice') then
      jsonb_build_object('type', 'choice', 'optionId', p_answer -> 'optionId')
    when p_type = 'matching' then jsonb_build_object('type', 'matching', 'pairs', p_answer -> 'pairs')
    when p_type = 'ordering' then jsonb_build_object('type', 'ordering', 'order', p_answer -> 'order')
    when p_type = 'pattern' then jsonb_build_object('type', 'pattern', 'fills', p_answer -> 'fills')
    else null
  end;
$$;

-- Checks a question's key against its public config by grading the key's own
-- "perfect" answer. Returns null when consistent, else a problem code.
create function private.question_key_problem(p_question_id uuid)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_q public.questions;
  v_k private.question_answer_keys;
  v_resp jsonb;
  v_g record;
begin
  select * into v_q from public.questions where id = p_question_id;
  if not found then return 'question_missing'; end if;
  select * into v_k from private.question_answer_keys where question_id = p_question_id;
  if not found then return 'key_missing'; end if;

  v_resp := case
    when v_q.type in ('single_choice', 'image_choice') and v_k.answer ->> 'type' = 'choice' then
      jsonb_build_object('type', v_q.type, 'optionId', v_k.answer -> 'optionId')
    when v_q.type = 'matching' and v_k.answer ->> 'type' = 'matching' then
      jsonb_build_object('type', 'matching', 'pairs', v_k.answer -> 'pairs')
    when v_q.type = 'memory' and v_k.answer ->> 'type' = 'memory' then
      jsonb_build_object('type', 'memory', 'pairs', v_k.answer -> 'pairs')
    when v_q.type = 'ordering' and v_k.answer ->> 'type' = 'ordering' then
      jsonb_build_object('type', 'ordering', 'order', v_k.answer -> 'order')
    when v_q.type = 'pattern' and v_k.answer ->> 'type' = 'pattern' then
      jsonb_build_object('type', 'pattern', 'fills', v_k.answer -> 'fills')
  end;
  if v_resp is null then return 'key_type_mismatch'; end if;

  select * into v_g from private.grade_response(v_q, v_k.answer, v_resp);
  if not v_g.valid or v_g.score <> v_g.max_score then return 'key_inconsistent'; end if;
  if v_q.type = 'matching'
    and v_g.max_score <> jsonb_array_length(v_q.config -> 'left') then return 'key_incomplete'; end if;
  if v_q.type = 'memory'
    and v_g.max_score * 2 <> jsonb_array_length(v_q.config -> 'cards') then return 'key_incomplete'; end if;
  if v_k.hint_eliminate is not null and (
    v_q.type not in ('single_choice', 'image_choice')
    or v_k.hint_eliminate = v_k.answer ->> 'optionId'
    or not (v_k.hint_eliminate = any (private.text_array(v_q.config -> 'options', 'id')))
  ) then return 'hint_invalid'; end if;
  return null;
end;
$$;

-- ── Mastery (configurable rule, private.mastery_config) ─────────────────
-- Evidence = FIRST attempts on the skill's questions inside the window, so
-- retries cannot inflate accuracy. Mastered needs accuracy, volume, more
-- than one session and more than a few distinct questions. A skill that was
-- mastered and no longer meets the rule moves to `review`.

create function private.recompute_skill_mastery(p_child_id uuid, p_skill_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  cfg private.mastery_config;
  v_evidence integer;
  v_correct integer;
  v_distinct integer;
  v_sessions integer;
  v_acc numeric(4, 3);
  v_prev_mastered timestamptz;
  v_mastered boolean;
  v_state public.mastery_state;
begin
  select * into cfg from private.mastery_config where id;
  select count(*), count(*) filter (where a.is_correct), count(distinct a.question_id), count(distinct a.session_id)
  into v_evidence, v_correct, v_distinct, v_sessions
  from public.question_attempts a
  where a.child_id = p_child_id and a.skill_id = p_skill_id and a.attempt_no = 1
    and a.created_at >= now() - make_interval(days => cfg.window_days);

  v_acc := case when v_evidence > 0 then round(v_correct::numeric / v_evidence, 3) else 0 end;
  select sm.mastered_at into v_prev_mastered from public.skill_mastery sm
  where sm.child_id = p_child_id and sm.skill_id = p_skill_id;

  v_mastered := v_evidence >= cfg.min_evidence
    and v_acc >= cfg.min_accuracy
    and v_sessions >= cfg.min_sessions
    and v_distinct >= cfg.min_distinct_questions;

  v_state := case
    when v_mastered then 'mastered'
    when v_prev_mastered is not null then 'review'
    when v_evidence = 0 then 'not_started'
    when v_evidence <= cfg.learning_max_evidence or v_acc < cfg.learning_max_accuracy then 'learning'
    else 'practicing'
  end::public.mastery_state;

  insert into public.skill_mastery as sm
    (child_id, skill_id, state, accuracy, evidence_count, distinct_questions, session_count, mastered_at, last_practiced_at)
  values
    (p_child_id, p_skill_id, v_state, v_acc, v_evidence, v_distinct, v_sessions,
     case when v_mastered then now() end, now())
  on conflict (child_id, skill_id) do update set
    state = excluded.state,
    accuracy = excluded.accuracy,
    evidence_count = excluded.evidence_count,
    distinct_questions = excluded.distinct_questions,
    session_count = excluded.session_count,
    mastered_at = case when v_mastered then coalesce(sm.mastered_at, now()) else sm.mastered_at end,
    last_practiced_at = now();
end;
$$;

-- ── Rewards (server-evaluated, granted once) ────────────────────────────

create function private.evaluate_rewards(p_child_id uuid, p_session_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  r public.rewards;
  v_ok boolean;
  v_target integer;
  v_lesson text;
begin
  select l.slug into v_lesson
  from public.learning_sessions s join public.lessons l on l.id = s.lesson_id
  where s.id = p_session_id;

  for r in
    select * from public.rewards rw
    where rw.status = 'published'
      and not exists (select 1 from public.child_rewards cr where cr.child_id = p_child_id and cr.reward_id = rw.id)
    order by rw.sort_order
  loop
    v_target := coalesce((r.rule ->> 'count')::integer, 1);
    v_ok := case r.rule ->> 'kind'
      when 'lessons_completed' then (
        select count(*) >= v_target from public.child_lesson_progress clp where clp.child_id = p_child_id
      )
      when 'modules_explored' then (
        select count(distinct s.module_id) >= v_target
        from public.child_lesson_progress clp
        join public.lessons l on l.id = clp.lesson_id
        join public.skills s on s.id = l.skill_id
        where clp.child_id = p_child_id
      )
      when 'module_lessons_completed' then (
        select count(*) >= v_target
        from public.child_lesson_progress clp
        join public.lessons l on l.id = clp.lesson_id
        join public.skills s on s.id = l.skill_id
        join public.modules m on m.id = s.module_id
        where clp.child_id = p_child_id and m.slug = r.rule ->> 'module'
      )
      else false
    end;
    if v_ok then
      insert into public.child_rewards (child_id, reward_id, session_id, reason)
      values (p_child_id, r.id, p_session_id, format('%s (bài %s)', r.criteria_vi, v_lesson))
      on conflict (child_id, reward_id) do nothing;
    end if;
  end loop;
end;
$$;

-- ── Sessions ────────────────────────────────────────────────────────────

create function private.stars_for(p_first_try integer, p_total integer)
returns smallint
language sql
immutable
set search_path = ''
as $$
  -- D-032: 1 for finishing, +1 if at least half right first time, +1 if all.
  select case when p_total <= 0 then 0 else
    1 + (case when p_first_try >= ceil(p_total / 2.0) then 1 else 0 end)
      + (case when p_first_try = p_total then 1 else 0 end)
  end::smallint;
$$;

-- The published question at a 0-based position of a lesson.
create function private.lesson_question_at(p_lesson_id uuid, p_index integer)
returns public.questions
language sql
stable
set search_path = ''
as $$
  select q.*
  from public.lesson_questions lq
  join public.questions q on q.id = lq.question_id
  where lq.lesson_id = p_lesson_id and q.status = 'published'
  order by lq.position
  offset greatest(p_index, 0) limit 1;
$$;

create function private.session_state(p_session_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'sessionId', s.id,
    'lessonId', l.slug,
    'status', s.status,
    'currentIndex', s.current_index,
    'total', s.total_questions,
    'startedAt', s.started_at,
    'attempt', (
      select count(*) + 1 from public.question_attempts a
      where a.session_id = s.id
        and a.question_id = (private.lesson_question_at(s.lesson_id, s.current_index)).id
    ),
    'results', coalesce((
      select jsonb_agg(x.r order by x.pos)
      from (
        select min(lq.position) as pos, jsonb_build_object(
          'questionId', q.slug,
          'correct', bool_or(a.is_correct),
          'firstTry', bool_or(a.is_correct and a.attempt_no = 1),
          'attempts', max(a.attempt_no)
        ) as r
        from public.question_attempts a
        join public.questions q on q.id = a.question_id
        join public.lesson_questions lq on lq.lesson_id = s.lesson_id and lq.question_id = a.question_id
        where a.session_id = s.id
        group by q.slug
        having bool_or(a.is_final)
      ) x
    ), '[]'::jsonb)
  )
  from public.learning_sessions s
  join public.lessons l on l.id = s.lesson_id
  where s.id = p_session_id;
$$;

-- Marks the session completed and applies its effects exactly once.
create function private.finish_session(p_session_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  s public.learning_sessions;
  v_stars smallint;
begin
  select * into s from public.learning_sessions where id = p_session_id for update;
  if s.status <> 'in_progress' or s.current_index < s.total_questions then
    return;
  end if;
  v_stars := private.stars_for(s.first_try_count, s.total_questions);
  update public.learning_sessions
  set status = 'completed', completed_at = now(), stars = v_stars
  where id = p_session_id;

  insert into public.child_lesson_progress as p
    (child_id, lesson_id, best_stars, completions, last_session_id, first_completed_at, last_completed_at)
  values (s.child_id, s.lesson_id, v_stars, 1, s.id, now(), now())
  on conflict (child_id, lesson_id) do update set
    best_stars = greatest(p.best_stars, excluded.best_stars),
    completions = p.completions + 1,
    last_session_id = excluded.last_session_id,
    last_completed_at = excluded.last_completed_at;

  perform private.evaluate_rewards(s.child_id, s.id);
end;
$$;

create function private.session_result(p_session_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'sessionId', s.id,
    'lessonId', l.slug,
    'status', s.status,
    'stars', coalesce(s.stars, 0),
    'total', s.total_questions,
    'correct', s.correct_count,
    'firstTry', s.first_try_count,
    'score', s.score,
    'maxScore', s.max_score,
    'startedAt', s.started_at,
    'completedAt', s.completed_at,
    'durationSeconds', s.duration_seconds,
    'newRewards', coalesce((
      select jsonb_agg(rw.key order by rw.sort_order)
      from public.child_rewards cr join public.rewards rw on rw.id = cr.reward_id
      where cr.session_id = s.id
    ), '[]'::jsonb)
  )
  from public.learning_sessions s
  join public.lessons l on l.id = s.lesson_id
  where s.id = p_session_id;
$$;

-- Loads a session the caller may act on (row-locked when p_lock).
create function private.load_session(p_session_id uuid, p_lock boolean)
returns public.learning_sessions
language plpgsql
set search_path = ''
as $$
declare
  s public.learning_sessions;
begin
  perform private.require_uid();
  if p_lock then
    select * into s from public.learning_sessions where id = p_session_id for update;
  else
    select * into s from public.learning_sessions where id = p_session_id;
  end if;
  if not found or not private.can_access_child(s.child_id) then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  return s;
end;
$$;

-- Start (or resume) a lesson. Idempotent: an open session for the same
-- child+lesson is returned instead of creating a second one.
create function public.start_session(p_child_id uuid, p_lesson_slug text, p_restart boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id);
  v_lesson public.lessons;
  v_state text;
  v_total integer;
  v_session uuid;
begin
  select l.* into v_lesson from public.lessons l where l.slug = p_lesson_slug and l.status = 'published';
  if not found then
    perform private.fail('lesson_not_found');
  end if;
  select st.state into v_state from private.child_lesson_states(v_child.id) st where st.lesson_id = v_lesson.id;
  if v_state is null then
    perform private.fail('lesson_not_found');
  elsif v_state = 'locked' then
    perform private.fail('lesson_locked');
  end if;

  -- Serialise starts for this child.
  perform 1 from public.children c where c.id = v_child.id for update;

  select s.id into v_session from public.learning_sessions s
  where s.child_id = v_child.id and s.lesson_id = v_lesson.id and s.status = 'in_progress';
  if v_session is not null and p_restart then
    update public.learning_sessions set status = 'abandoned', abandoned_at = now() where id = v_session;
    v_session := null;
  end if;

  if v_session is null then
    select count(*) into v_total
    from public.lesson_questions lq join public.questions q on q.id = lq.question_id
    where lq.lesson_id = v_lesson.id and q.status = 'published';
    if v_total = 0 then
      perform private.fail('lesson_empty');
    end if;
    insert into public.learning_sessions (child_id, lesson_id, total_questions, started_by)
    values (v_child.id, v_lesson.id, v_total, auth.uid())
    returning id into v_session;
    return private.session_state(v_session) || jsonb_build_object('resumed', false);
  end if;
  return private.session_state(v_session) || jsonb_build_object('resumed', true);
end;
$$;

-- The open session (if any) for a child and lesson. Read-only.
create function public.get_active_session(p_child_id uuid, p_lesson_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id);
  v_session uuid;
begin
  select s.id into v_session
  from public.learning_sessions s join public.lessons l on l.id = s.lesson_id
  where s.child_id = v_child.id and l.slug = p_lesson_slug and s.status = 'in_progress';
  if v_session is null then
    return null;
  end if;
  return private.session_state(v_session);
end;
$$;

-- Grade one answer. Idempotent per (session, idempotency key): a repeated
-- request returns the stored result and changes nothing.
create function public.submit_attempt(
  p_session_id uuid,
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
  s public.learning_sessions;
  q public.questions;
  k private.question_answer_keys;
  a public.question_attempts;
  g record;
  v_attempt_no integer;
  v_correct boolean;
  v_final boolean;
  v_text text;
  v_next text;
  v_correct_msgs text[] := array[
    'Đúng rồi! Con nhìn rất kỹ!',
    'Chính xác! Con cố gắng tuyệt lắm!',
    'Đúng rồi! Mình cùng đi tiếp nhé!'
  ];
begin
  if p_idempotency_key is null then
    perform private.fail('idempotency_key_required');
  end if;
  s := private.load_session(p_session_id, true);

  -- Replay: same key → same answer, no new effects.
  select * into a from public.question_attempts
  where session_id = s.id and idempotency_key = p_idempotency_key;
  if found then
    select * into q from public.questions where id = a.question_id;
    select * into k from private.question_answer_keys where question_id = q.id;
    s := private.load_session(p_session_id, false);
    return jsonb_build_object(
      'attemptId', a.id,
      'attemptNo', a.attempt_no,
      'isCorrect', a.is_correct,
      'score', a.score,
      'maxScore', a.max_score,
      'feedback', jsonb_build_object('text', a.feedback_text),
      'canRetry', not a.is_final,
      'nextAction', case
        when not a.is_final then 'retry'
        when s.current_index >= s.total_questions then 'complete'
        else 'continue' end,
      'reveal', case when a.is_final and not a.is_correct then private.reveal_for(q.type, k.answer) end,
      'replayed', true
    );
  end if;

  if s.status <> 'in_progress' then
    perform private.fail('session_not_active');
  end if;
  perform 1 from public.children c where c.id = s.child_id and c.status = 'active';
  if not found then
    perform private.fail('child_archived');
  end if;

  q := private.lesson_question_at(s.lesson_id, s.current_index);
  if q.id is null or q.slug <> p_question_slug then
    perform private.fail('question_mismatch');
  end if;
  select * into k from private.question_answer_keys where question_id = q.id;
  if not found then
    perform private.fail('question_unavailable');
  end if;

  select count(*) + 1 into v_attempt_no from public.question_attempts
  where session_id = s.id and question_id = q.id;
  if v_attempt_no > q.max_attempts then
    perform private.fail('question_closed'); -- defensive; index advances when final
  end if;

  select * into g from private.grade_response(q, k.answer, p_response);
  if not g.valid then
    perform private.fail('invalid_response');
  end if;

  v_correct := g.score = g.max_score;
  v_final := v_correct or v_attempt_no >= q.max_attempts;
  v_text := case
    when v_correct then coalesce(q.feedback ->> 'correctText', v_correct_msgs[(v_attempt_no % 3) + 1])
    when v_final then 'Cùng xem đáp án nhé. Lần sau con sẽ làm được!'
    else coalesce(q.feedback ->> 'incorrectText', 'Gần đúng rồi! Con thử lại nhé.')
  end;

  insert into public.question_attempts
    (session_id, child_id, question_id, skill_id, attempt_no, response, is_correct, score, max_score,
     is_final, feedback_text, idempotency_key)
  values
    (s.id, s.child_id, q.id, q.skill_id, v_attempt_no, p_response, v_correct, g.score, g.max_score,
     v_final, v_text, p_idempotency_key)
  returning * into a;

  if v_attempt_no = 1 then
    perform private.recompute_skill_mastery(s.child_id, q.skill_id);
  end if;

  if v_final then
    update public.learning_sessions set
      current_index = current_index + 1,
      correct_count = correct_count + (case when v_correct then 1 else 0 end),
      incorrect_count = incorrect_count + (case when v_correct then 0 else 1 end),
      first_try_count = first_try_count + (case when v_correct and v_attempt_no = 1 then 1 else 0 end),
      score = score + g.score,
      max_score = max_score + g.max_score
    where id = s.id
    returning * into s;
    if s.current_index >= s.total_questions then
      perform private.finish_session(s.id);
      v_next := 'complete';
    else
      v_next := 'continue';
    end if;
  else
    v_next := 'retry';
  end if;

  return jsonb_build_object(
    'attemptId', a.id,
    'attemptNo', a.attempt_no,
    'isCorrect', v_correct,
    'score', g.score,
    'maxScore', g.max_score,
    'feedback', jsonb_build_object('text', v_text),
    'canRetry', not v_final,
    'nextAction', v_next,
    'reveal', case when v_final and not v_correct then private.reveal_for(q.type, k.answer) end,
    'replayed', false
  );
end;
$$;

-- A gentle hint for the CURRENT question: text, and for choice questions one
-- wrong option to fade out. Never the correct answer.
create function public.request_hint(p_session_id uuid, p_question_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.learning_sessions := private.load_session(p_session_id, false);
  q public.questions;
  v_elim text;
begin
  if s.status <> 'in_progress' then
    perform private.fail('session_not_active');
  end if;
  q := private.lesson_question_at(s.lesson_id, s.current_index);
  if q.id is null or q.slug <> p_question_slug then
    perform private.fail('question_mismatch');
  end if;
  if q.type in ('single_choice', 'image_choice') then
    select k.hint_eliminate into v_elim from private.question_answer_keys k where k.question_id = q.id;
  end if;
  return jsonb_build_object(
    'text', coalesce(q.feedback ->> 'hint', 'Con nhìn thật kỹ từng hình nhé.'),
    'eliminateOptionId', v_elim
  );
end;
$$;

create function public.get_session_state(p_session_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.learning_sessions := private.load_session(p_session_id, false);
begin
  return private.session_state(s.id);
end;
$$;

-- Authoritative result. Finishes the session if every question is done
-- (normally submit_attempt already did); idempotent.
create function public.complete_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.learning_sessions := private.load_session(p_session_id, true);
begin
  if s.status = 'in_progress' then
    if s.current_index < s.total_questions then
      perform private.fail('session_incomplete');
    end if;
    perform private.finish_session(s.id);
  elsif s.status = 'abandoned' then
    perform private.fail('session_not_active');
  end if;
  return private.session_result(s.id);
end;
$$;

create function public.get_session_result(p_session_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.learning_sessions := private.load_session(p_session_id, false);
begin
  return private.session_result(s.id);
end;
$$;

-- Keeps attempts; marks the session abandoned. Idempotent.
create function public.abandon_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.learning_sessions := private.load_session(p_session_id, true);
begin
  if s.status = 'in_progress' then
    update public.learning_sessions set status = 'abandoned', abandoned_at = now() where id = s.id;
  end if;
end;
$$;

-- ── Student overview (one round trip for Home / Explore / World / Rewards)

create function public.get_student_overview(p_child_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id);
  v_result jsonb;
begin
  with states as (
    select * from private.child_lesson_states(v_child.id)
  ),
  module_counts as (
    select st.module_id,
      count(*) as total,
      count(*) filter (where st.state = 'completed') as completed,
      bool_or(st.state <> 'locked') as any_open
    from states st group by st.module_id
  )
  select jsonb_build_object(
    'child', jsonb_build_object(
      'id', v_child.id,
      'nickname', v_child.nickname,
      'avatarKey', v_child.avatar_key,
      'rewardsSeenAt', v_child.rewards_seen_at
    ),
    'modules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.slug,
        'state', case
          when m.unlock_min_completed_lessons is not null
            and (select count(*) from public.child_lesson_progress c where c.child_id = v_child.id)
                < m.unlock_min_completed_lessons then 'locked'
          when mc.completed = mc.total then 'completed'
          else 'available' end,
        'completed', mc.completed,
        'total', mc.total
      ) order by m.sort_order)
      from module_counts mc join public.modules m on m.id = mc.module_id
    ), '[]'::jsonb),
    'lessons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.slug,
        'state', st.state,
        'record', case when clp.lesson_id is null then null else jsonb_build_object(
          'bestStars', clp.best_stars,
          'plays', clp.completions,
          'firstCompletedAt', clp.first_completed_at,
          'lastCompletedAt', clp.last_completed_at,
          'last', (
            select jsonb_build_object(
              'stars', coalesce(ls.stars, 0),
              'total', ls.total_questions,
              'correct', ls.correct_count,
              'firstTry', ls.first_try_count,
              'newRewards', coalesce((
                select jsonb_agg(rw.key) from public.child_rewards cr
                join public.rewards rw on rw.id = cr.reward_id where cr.session_id = ls.id
              ), '[]'::jsonb)
            )
            from public.learning_sessions ls where ls.id = clp.last_session_id
          )
        ) end
      ))
      from states st
      join public.lessons l on l.id = st.lesson_id
      left join public.child_lesson_progress clp on clp.child_id = v_child.id and clp.lesson_id = l.id
    ), '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object('id', rw.key, 'earnedAt', cr.granted_at, 'reason', cr.reason)
        order by cr.granted_at)
      from public.child_rewards cr join public.rewards rw on rw.id = cr.reward_id
      where cr.child_id = v_child.id
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(h.e order by h.at)
      from (
        (select ls.completed_at as at, jsonb_build_object(
            'type', 'lesson', 'lessonId', l.slug, 'stars', ls.stars, 'at', ls.completed_at) as e
          from public.learning_sessions ls join public.lessons l on l.id = ls.lesson_id
          where ls.child_id = v_child.id and ls.status = 'completed'
          order by ls.completed_at desc limit 100)
        union all
        (select cr.granted_at, jsonb_build_object('type', 'badge', 'rewardId', rw.key, 'at', cr.granted_at)
          from public.child_rewards cr join public.rewards rw on rw.id = cr.reward_id
          where cr.child_id = v_child.id
          order by cr.granted_at desc limit 50)
      ) h
    ), '[]'::jsonb),
    'inProgress', (
      select private.session_state(ls.id)
      from public.learning_sessions ls
      where ls.child_id = v_child.id and ls.status = 'in_progress'
      order by ls.updated_at desc limit 1
    ),
    'mastery', coalesce((
      select jsonb_agg(jsonb_build_object(
        'skillId', sk.slug, 'state', sm.state, 'accuracy', sm.accuracy,
        'evidence', sm.evidence_count, 'lastPracticedAt', sm.last_practiced_at))
      from public.skill_mastery sm join public.skills sk on sk.id = sm.skill_id
      where sm.child_id = v_child.id
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

-- Today's plan: stored on first request of the day so it stays stable while
-- the child learns. Only published lesson slugs are accepted.
create function public.ensure_daily_plan(p_child_id uuid, p_plan_date date, p_lesson_slugs text[])
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_child public.children := private.assert_child_access(p_child_id);
  v_ids uuid[];
  v_out text[];
begin
  if p_plan_date is null or p_plan_date not between (current_date - 2) and (current_date + 2) then
    perform private.fail('invalid_date');
  end if;
  if not exists (select 1 from public.child_daily_plans d where d.child_id = v_child.id and d.plan_date = p_plan_date) then
    if p_lesson_slugs is null or cardinality(p_lesson_slugs) not between 1 and 5 then
      perform private.fail('invalid_plan');
    end if;
    select array_agg(l.id order by array_position(p_lesson_slugs, l.slug)) into v_ids
    from public.lessons l where l.slug = any (p_lesson_slugs) and l.status = 'published';
    if v_ids is null or cardinality(v_ids) <> cardinality(p_lesson_slugs) then
      perform private.fail('invalid_plan');
    end if;
    insert into public.child_daily_plans (child_id, plan_date, lesson_ids)
    values (v_child.id, p_plan_date, v_ids)
    on conflict (child_id, plan_date) do nothing;
  end if;
  select array_agg(l.slug order by array_position(d.lesson_ids, l.id)) into v_out
  from public.child_daily_plans d
  join public.lessons l on l.id = any (d.lesson_ids)
  where d.child_id = v_child.id and d.plan_date = p_plan_date;
  return v_out;
end;
$$;

-- ── Staff roles & publishing ────────────────────────────────────────────

create function public.grant_staff_role(p_user_id uuid, p_role public.staff_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_uid();
  if not private.has_staff_role('admin') then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  insert into public.staff_roles (user_id, role, granted_by) values (p_user_id, p_role, auth.uid())
  on conflict (user_id, role) do nothing;
  perform private.audit('staff_role.grant', 'profile', p_user_id::text, jsonb_build_object('role', p_role));
end;
$$;

create function public.revoke_staff_role(p_user_id uuid, p_role public.staff_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_uid();
  if not private.has_staff_role('admin') then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if p_user_id = auth.uid() and p_role = 'admin' then
    perform private.fail('cannot_revoke_own_admin');
  end if;
  delete from public.staff_roles where user_id = p_user_id and role = p_role;
  perform private.audit('staff_role.revoke', 'profile', p_user_id::text, jsonb_build_object('role', p_role));
end;
$$;

-- Workflow: draft → in_review (editor) → published (publisher) → archived
-- (publisher); in_review → draft (reviewer/editor); archived → draft (editor).
create function public.set_content_status(p_entity text, p_id uuid, p_status public.content_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from public.content_status;
  v_table text;
  v_allowed boolean;
  v_problem text;
begin
  perform private.require_uid();
  v_table := case p_entity
    when 'module' then 'modules' when 'skill' then 'skills' when 'lesson' then 'lessons'
    when 'question' then 'questions' when 'reward' then 'rewards' end;
  if v_table is null then
    perform private.fail('invalid_entity');
  end if;
  execute format('select status from public.%I where id = $1 for update', v_table) into v_from using p_id;
  if v_from is null then
    perform private.fail('not_found');
  end if;

  v_allowed := case
    when v_from = 'draft' and p_status = 'in_review' then private.has_staff_role('content_editor')
    when v_from = 'in_review' and p_status = 'draft' then
      private.has_staff_role('content_reviewer') or private.has_staff_role('content_editor')
    when v_from = 'in_review' and p_status = 'published' then private.has_staff_role('publisher')
    when v_from = 'published' and p_status = 'archived' then private.has_staff_role('publisher')
    when v_from = 'archived' and p_status = 'draft' then private.has_staff_role('content_editor')
    else null
  end;
  if v_allowed is null then
    perform private.fail('invalid_transition');
  elsif not v_allowed then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;

  if p_entity = 'question' and p_status = 'published' then
    v_problem := private.question_key_problem(p_id);
    if v_problem is not null then
      perform private.fail(v_problem);
    end if;
  end if;

  execute format(
    'update public.%I set status = $1, published_at = case when $1 = ''published'' then now() else published_at end where id = $2',
    v_table
  ) using p_status, p_id;
  insert into public.content_publication_history (entity, entity_id, from_status, to_status, actor_id)
  values (p_entity, p_id, v_from, p_status, auth.uid());
  perform private.audit('content.status', p_entity, p_id::text,
    jsonb_build_object('from', v_from, 'to', p_status));
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
    'public.create_family(text, text)',
    'public.create_child(uuid, text, text, smallint, jsonb)',
    'public.archive_child(uuid)',
    'public.start_session(uuid, text, boolean)',
    'public.get_active_session(uuid, text)',
    'public.submit_attempt(uuid, text, jsonb, uuid)',
    'public.request_hint(uuid, text)',
    'public.get_session_state(uuid)',
    'public.complete_session(uuid)',
    'public.get_session_result(uuid)',
    'public.abandon_session(uuid)',
    'public.get_student_overview(uuid)',
    'public.ensure_daily_plan(uuid, date, text[])',
    'public.grant_staff_role(uuid, public.staff_role)',
    'public.revoke_staff_role(uuid, public.staff_role)',
    'public.set_content_status(text, uuid, public.content_status)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;
