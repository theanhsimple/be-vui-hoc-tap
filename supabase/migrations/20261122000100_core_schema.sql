-- little — Sprint 04 — core schema
--
-- Additive only. Creates the identity/family, content, progress, assessment
-- (prepared), reward and audit tables. Security (RLS, grants, helper
-- functions) is in 20261122000200_security.sql; the learning engine RPCs are
-- in 20261122000300_learning_engine.sql.
--
-- Conventions: uuid PKs, snake_case, timestamptz (UTC) with defaults,
-- updated_at maintained by trigger, archive instead of delete for family data.

create schema if not exists private;
revoke all on schema private from public;
comment on schema private is
  'Not exposed through the Data API. Answer keys, configuration and internal helpers.';

-- ── Enums ───────────────────────────────────────────────────────────────

create type public.family_role as enum ('owner', 'guardian');
create type public.membership_status as enum ('active', 'invited', 'removed');
create type public.staff_role as enum ('content_editor', 'content_reviewer', 'publisher', 'admin');
create type public.content_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.question_type as enum
  ('single_choice', 'image_choice', 'matching', 'ordering', 'pattern', 'memory');
create type public.child_status as enum ('active', 'archived');
create type public.session_status as enum ('in_progress', 'completed', 'abandoned');
create type public.mastery_state as enum ('not_started', 'learning', 'practicing', 'mastered', 'review');
create type public.reward_kind as enum ('badge', 'sticker', 'real_world');

-- ── Shared trigger ──────────────────────────────────────────────────────

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── Identity & family ───────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  locale text not null default 'vi' check (locale in ('vi', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user (guardians and staff). Holds no role: see staff_roles / family_members.';

create table public.families (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  created_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.families is 'A private learning space. Created only through create_family().';

create table public.family_members (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.family_role not null,
  status public.membership_status not null default 'active',
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (family_id, user_id)
);
create index family_members_user_idx on public.family_members (user_id) where status = 'active';
-- Exactly one active owner per family.
create unique index family_members_one_owner on public.family_members (family_id)
  where role = 'owner' and status = 'active';

create table public.guardian_consents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  consent_version text not null check (consent_version ~ '^[a-z0-9.-]{1,32}$'),
  consented_at timestamptz not null default now(),
  withdrawn_at timestamptz
);
create index guardian_consents_family_idx on public.guardian_consents (family_id);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 1 and 20),
  avatar_key text not null check (avatar_key ~ '^[a-z0-9-]{1,32}$'),
  -- Data minimisation: birth year only, optional. No full date of birth, no photo, no email.
  birth_year smallint check (birth_year is null or birth_year between 2010 and 2100),
  preferences jsonb not null default '{}'::jsonb
    check (jsonb_typeof(preferences) = 'object' and pg_column_size(preferences) <= 2048),
  status public.child_status not null default 'active',
  archived_at timestamptz,
  rewards_seen_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint children_archive_consistent check ((status = 'archived') = (archived_at is not null))
);
create index children_family_idx on public.children (family_id);

create table public.staff_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.staff_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ── Content ─────────────────────────────────────────────────────────────

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,64}$'),
  title_vi text not null check (char_length(title_vi) between 1 and 80),
  title_en text not null default '' check (char_length(title_en) <= 80),
  category text not null default '' check (char_length(category) <= 40),
  description text not null default '' check (char_length(description) <= 300),
  tone text not null check (tone ~ '^[a-z]{1,20}$'),
  illustration text not null check (illustration ~ '^[a-z0-9.-]{1,64}$'),
  sort_order integer not null default 0,
  -- Progression rule (D-031): locked until this many lessons are completed anywhere.
  unlock_min_completed_lessons smallint check (unlock_min_completed_lessons is null or unlock_min_completed_lessons between 1 and 100),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,64}$'),
  title_vi text not null check (char_length(title_vi) between 1 and 80),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index skills_module_idx on public.skills (module_id, sort_order);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,64}$'),
  title_vi text not null check (char_length(title_vi) between 1 and 80),
  objective_vi text not null default '' check (char_length(objective_vi) <= 200),
  minutes smallint not null default 5 check (minutes between 1 and 30),
  cover jsonb not null check (jsonb_typeof(cover) = 'object'),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_skill_idx on public.lessons (skill_id, sort_order);

-- Public, safe-to-ship question content. Contains NO correctness information.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,64}$'),
  skill_id uuid not null references public.skills (id) on delete restrict,
  type public.question_type not null,
  difficulty smallint not null check (difficulty between 1 and 4),
  prompt_vi text not null check (char_length(prompt_vi) between 1 and 200),
  instruction_audio_url text check (instruction_audio_url is null or instruction_audio_url ~ '^(https://|/)'),
  stimulus jsonb check (stimulus is null or jsonb_typeof(stimulus) = 'object'),
  memorize jsonb check (memorize is null or jsonb_typeof(memorize) = 'object'),
  feedback jsonb check (feedback is null or jsonb_typeof(feedback) = 'object'),
  -- Type-specific public configuration (options / left-right / items / sequence-palette / cards).
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  max_attempts smallint not null default 2 check (max_attempts between 1 and 5),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_skill_idx on public.questions (skill_id, status);

-- PRIVATE answer keys. Never granted to anon/authenticated; read only by
-- security-definer grading functions.
create table private.question_answer_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  answer jsonb not null check (jsonb_typeof(answer) = 'object' and answer ? 'type'),
  -- For choice questions: one WRONG option to fade out as a hint.
  hint_eliminate text,
  updated_at timestamptz not null default now()
);

create table public.lesson_questions (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  position smallint not null check (position between 1 and 50),
  primary key (lesson_id, position),
  unique (lesson_id, question_id)
);
create index lesson_questions_question_idx on public.lesson_questions (question_id);

-- ── Rewards catalogue ───────────────────────────────────────────────────

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9-]{1,64}$'),
  kind public.reward_kind not null default 'badge',
  title_vi text not null check (char_length(title_vi) between 1 and 80),
  title_en text not null default '',
  criteria_vi text not null default '',
  illustration text not null check (illustration ~ '^[a-z0-9.-]{1,64}$'),
  -- Server-evaluated rule, e.g. {"kind":"lessons_completed","count":1}.
  rule jsonb not null check (jsonb_typeof(rule) = 'object' and rule ? 'kind'),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Learning activity (child data) ──────────────────────────────────────

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete restrict,
  status public.session_status not null default 'in_progress',
  -- 0-based index of the question the child is on (= number of finished questions).
  current_index smallint not null default 0 check (current_index >= 0),
  total_questions smallint not null check (total_questions between 1 and 50),
  correct_count smallint not null default 0,
  incorrect_count smallint not null default 0,
  first_try_count smallint not null default 0,
  score numeric(7, 2) not null default 0,
  max_score numeric(7, 2) not null default 0,
  stars smallint check (stars is null or stars between 0 and 3),
  started_by uuid references public.profiles (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz,
  updated_at timestamptz not null default now(),
  duration_seconds integer generated always as
    (case when completed_at is not null then floor(extract(epoch from (completed_at - started_at)))::integer end) stored,
  constraint learning_sessions_index_bound check (current_index <= total_questions),
  constraint learning_sessions_completed check ((status = 'completed') = (completed_at is not null)),
  constraint learning_sessions_abandoned check ((status = 'abandoned') = (abandoned_at is not null))
);
-- At most one active session per child and lesson (also makes start idempotent).
create unique index learning_sessions_one_active on public.learning_sessions (child_id, lesson_id)
  where status = 'in_progress';
create index learning_sessions_child_idx on public.learning_sessions (child_id, started_at desc);

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  skill_id uuid not null references public.skills (id) on delete restrict,
  attempt_no smallint not null check (attempt_no between 1 and 10),
  response jsonb not null check (pg_column_size(response) <= 4096),
  is_correct boolean not null,
  score numeric(5, 2) not null,
  max_score numeric(5, 2) not null check (max_score > 0),
  is_final boolean not null,
  feedback_text text not null,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (session_id, question_id, attempt_no),
  unique (session_id, idempotency_key)
);
create index question_attempts_session_idx on public.question_attempts (session_id);
create index question_attempts_mastery_idx on public.question_attempts (child_id, skill_id, created_at desc);

create table public.child_lesson_progress (
  child_id uuid not null references public.children (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete restrict,
  best_stars smallint not null check (best_stars between 0 and 3),
  completions integer not null default 1 check (completions >= 1),
  last_session_id uuid references public.learning_sessions (id) on delete set null,
  first_completed_at timestamptz not null default now(),
  last_completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, lesson_id)
);

create table public.skill_mastery (
  child_id uuid not null references public.children (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  state public.mastery_state not null default 'not_started',
  accuracy numeric(4, 3) not null default 0 check (accuracy between 0 and 1),
  evidence_count integer not null default 0,
  distinct_questions integer not null default 0,
  session_count integer not null default 0,
  mastered_at timestamptz,
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (child_id, skill_id)
);

-- Mastery rule parameters (configurable without code changes; one row).
create table private.mastery_config (
  id boolean primary key default true check (id),
  min_accuracy numeric(4, 3) not null default 0.8,
  min_evidence integer not null default 10,
  min_sessions integer not null default 2,
  min_distinct_questions integer not null default 4,
  window_days integer not null default 60,
  learning_max_evidence integer not null default 4,
  learning_max_accuracy numeric(4, 3) not null default 0.5,
  updated_at timestamptz not null default now()
);
insert into private.mastery_config default values;

create table public.child_rewards (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  reward_id uuid not null references public.rewards (id) on delete restrict,
  session_id uuid references public.learning_sessions (id) on delete set null,
  reason text not null,
  granted_at timestamptz not null default now(),
  unique (child_id, reward_id)
);
create index child_rewards_session_idx on public.child_rewards (session_id);

-- Today's suggested lessons, fixed for the day once created.
create table public.child_daily_plans (
  child_id uuid not null references public.children (id) on delete cascade,
  plan_date date not null,
  lesson_ids uuid[] not null check (cardinality(lesson_ids) between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (child_id, plan_date)
);

-- ── Assessment (schema prepared; no experience in Sprint 04) ────────────

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,64}$'),
  title_vi text not null,
  purpose text not null default 'placement' check (purpose in ('placement', 'checkpoint')),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessment_items (
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  position smallint not null check (position between 1 and 100),
  primary key (assessment_id, position),
  unique (assessment_id, question_id)
);

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete restrict,
  child_id uuid not null references public.children (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  response jsonb not null,
  is_correct boolean not null,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (assessment_id, child_id, idempotency_key)
);
create index assessment_attempts_child_idx on public.assessment_attempts (child_id, created_at desc);

-- ── Audit ───────────────────────────────────────────────────────────────

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create table public.content_publication_history (
  id bigint generated always as identity primary key,
  entity text not null check (entity in ('module', 'skill', 'lesson', 'question', 'reward')),
  entity_id uuid not null,
  from_status public.content_status not null,
  to_status public.content_status not null,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index content_publication_history_entity_idx on public.content_publication_history (entity, entity_id);

-- ── updated_at triggers ─────────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'families', 'family_members', 'children', 'modules', 'skills', 'lessons',
    'questions', 'rewards', 'learning_sessions', 'child_lesson_progress', 'skill_mastery',
    'assessments'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',
      t
    );
  end loop;
end;
$$;

create trigger set_updated_at before update on private.question_answer_keys
  for each row execute function private.set_updated_at();

-- ── Profile row for every new auth user ─────────────────────────────────
-- SECURITY DEFINER: runs as the table owner because the signing-up user has
-- no insert privilege on profiles. It only copies a trimmed display name.

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 60), '');
begin
  insert into public.profiles (id, display_name) values (new.id, v_name)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Progress per module, derived (never stored twice). security_invoker: the
-- caller's RLS on child_lesson_progress applies.
create view public.child_module_progress
with (security_invoker = true) as
select
  clp.child_id,
  s.module_id,
  count(*)::integer as completed_lessons,
  sum(clp.best_stars)::integer as stars,
  max(clp.last_completed_at) as last_completed_at
from public.child_lesson_progress clp
join public.lessons l on l.id = clp.lesson_id
join public.skills s on s.id = l.skill_id
group by clp.child_id, s.module_id;
