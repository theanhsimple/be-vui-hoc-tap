import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { inject } from "vitest";

import { DEMO_WORLD_SOURCES } from "@/data/demo";
import { DEMO_ANSWER_KEYS } from "@/data/demo/answer-keys";
import type { LearningQuestion } from "@/features/learning/types";

export const env = () => inject("supabase");

const opts = {
  auth: { persistSession: false, autoRefreshToken: false },
} as const;

export function anonClient(): SupabaseClient {
  const { url, anonKey } = env();
  return createClient(url, anonKey, opts);
}

/**
 * SETUP ONLY: creates confirmed test users. Never used for assertions — every
 * security check runs as a signed-in user through the public API.
 */
function adminClient(): SupabaseClient {
  const { url, serviceKey } = env();
  return createClient(url, serviceKey, opts);
}

export interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

export async function createUser(label: string): Promise<TestUser> {
  const email = `${label}-${randomUUID().slice(0, 8)}@example.test`;
  const password = `Pw-${randomUUID()}1a`;
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: label },
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;
  return { id: data.user.id, email, client };
}

/**
 * SETUP ONLY: bootstrap a staff role with SQL as the database owner — the
 * documented way to create the first admin (no API role can do this).
 */
export function bootstrapStaffRole(userId: string, role: string) {
  if (!/^[0-9a-f-]{36}$/.test(userId) || !/^[a-z_]+$/.test(role))
    throw new Error("bad input");
  execFileSync(
    "psql",
    [
      env().dbUrl,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      `insert into public.staff_roles (user_id, role) values ('${userId}', '${role}')`,
    ],
    { stdio: "ignore" },
  );
}

export async function rpc<T = unknown>(
  client: SupabaseClient,
  fn: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error)
    throw Object.assign(new Error(error.message), { code: error.code });
  return data as T;
}

export async function rpcError(
  client: SupabaseClient,
  fn: string,
  args: Record<string, unknown>,
): Promise<{ code?: string; message: string }> {
  const { error } = await client.rpc(fn, args);
  if (!error) throw new Error(`${fn} unexpectedly succeeded`);
  return { code: error.code, message: error.message };
}

export async function createFamily(user: TestUser, name: string) {
  return rpc<string>(user.client, "create_family", {
    p_display_name: name,
    p_consent_version: "2026-11",
  });
}

export async function createChild(
  user: TestUser,
  familyId: string,
  nickname: string,
) {
  return rpc<string>(user.client, "create_child", {
    p_family_id: familyId,
    p_nickname: nickname,
    p_avatar_key: "sun",
  });
}

// ── Content helpers (from the reviewed TypeScript source) ───────────────

export const LESSONS = DEMO_WORLD_SOURCES.flatMap((w) =>
  w.skills.flatMap((s) =>
    s.lessons.map((l) => ({ ...l, worldId: w.id, skillId: s.id })),
  ),
);

export function lesson(id: string) {
  const l = LESSONS.find((x) => x.id === id);
  if (!l) throw new Error(`no lesson ${id}`);
  return l;
}

/** The correct response for a question, built from the private key. */
export function correctResponse(q: LearningQuestion): Record<string, unknown> {
  const key = DEMO_ANSWER_KEYS[q.id]!;
  switch (key.type) {
    case "choice":
      return { type: q.type, optionId: key.optionId };
    case "matching":
      return { type: "matching", pairs: key.pairs };
    case "ordering":
      return { type: "ordering", order: key.order };
    case "pattern":
      return { type: "pattern", fills: key.fills };
    case "memory": {
      if (q.type !== "memory") throw new Error("bad memory question");
      const groups = new Map<string, string[]>();
      for (const c of q.config.cards)
        groups.set(c.pairKey, [...(groups.get(c.pairKey) ?? []), c.id]);
      return { type: "memory", pairs: [...groups.values()], moves: 6 };
    }
  }
}

/** A valid but WRONG response. */
export function wrongResponse(q: LearningQuestion): Record<string, unknown> {
  const key = DEMO_ANSWER_KEYS[q.id]!;
  switch (q.type) {
    case "single_choice":
    case "image_choice": {
      const right = key.type === "choice" ? key.optionId : "";
      return {
        type: q.type,
        optionId: q.options.find((o) => o.id !== right)!.id,
      };
    }
    case "matching": {
      const rights = q.config.right.map((r) => r.id);
      const good = key.type === "matching" ? key.pairs : [];
      // rotate the correct rights by one: every pair wrong
      return {
        type: "matching",
        pairs: good.map(([l], i) => [
          l,
          good[(i + 1) % good.length]![1] ?? rights[0],
        ]),
      };
    }
    case "ordering": {
      const order = key.type === "ordering" ? [...key.order] : [];
      return { type: "ordering", order: [...order.slice(1), order[0]] };
    }
    case "pattern": {
      const fills = key.type === "pattern" ? [...key.fills] : [];
      const other = q.config.palette.find((p) => p.id !== fills[0])!.id;
      return { type: "pattern", fills: [other, ...fills.slice(1)] };
    }
    case "memory": {
      const ids = q.config.cards.map((c) => c.id);
      const byKey = new Map(q.config.cards.map((c) => [c.id, c.pairKey]));
      // pair each card with a card of a different picture
      const pairs: string[][] = [];
      const left = [...ids];
      while (left.length) {
        const a = left.shift()!;
        const j = left.findIndex((b) => byKey.get(b) !== byKey.get(a));
        const b = left.splice(j === -1 ? 0 : j, 1)[0]!;
        pairs.push([a, b]);
      }
      return { type: "memory", pairs, moves: 9 };
    }
  }
}

export interface AttemptResult {
  attemptId: string;
  attemptNo: number;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  feedback: { text: string };
  canRetry: boolean;
  nextAction: "retry" | "continue" | "complete";
  reveal: unknown;
  replayed: boolean;
}

export async function submit(
  user: TestUser,
  sessionId: string,
  questionId: string,
  response: Record<string, unknown>,
  key: string = randomUUID(),
) {
  return rpc<AttemptResult>(user.client, "submit_attempt", {
    p_session_id: sessionId,
    p_question_slug: questionId,
    p_response: response,
    p_idempotency_key: key,
  });
}

export async function startSession(
  user: TestUser,
  childId: string,
  lessonId: string,
  restart = false,
) {
  return rpc<{ sessionId: string; currentIndex: number; resumed: boolean }>(
    user.client,
    "start_session",
    { p_child_id: childId, p_lesson_slug: lessonId, p_restart: restart },
  );
}

/** Plays a whole lesson with correct answers on the first try. */
export async function playLesson(
  user: TestUser,
  childId: string,
  lessonId: string,
) {
  const s = await startSession(user, childId, lessonId);
  const results: AttemptResult[] = [];
  for (const q of lesson(lessonId).questions) {
    results.push(await submit(user, s.sessionId, q.id, correctResponse(q)));
  }
  return { sessionId: s.sessionId, results };
}

/** Plays a whole lesson answering wrong until each question closes. */
export async function playLessonWrong(
  user: TestUser,
  childId: string,
  lessonId: string,
) {
  const s = await startSession(user, childId, lessonId);
  for (const q of lesson(lessonId).questions) {
    for (;;) {
      const r = await submit(user, s.sessionId, q.id, wrongResponse(q));
      if (!r.canRetry) break;
    }
  }
  return s.sessionId;
}
