"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { cookies } from "next/headers";

import {
  getChild,
  getSelectedChild,
  SELECTED_CHILD_COOKIE,
  SELECTED_CHILD_COOKIE_OPTIONS,
} from "@/features/family/queries";
import { getSessionUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { GradeResult, HintResult, Reveal } from "../types";

/**
 * Learning Server Functions (public POST endpoints). Each one:
 *   1. validates input with Zod,
 *   2. requires a signed-in guardian and a selected child (cookie re-checked
 *      through RLS), and pins the session to THAT child,
 *   3. calls a database RPC that checks family access again, grades with the
 *      private key and records the result atomically.
 * The client never sends a score, an attempt number or a child id.
 */

const slug = z.string().regex(/^[a-z0-9-]{1,64}$/);
const optionId = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/i);

const responseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["single_choice", "image_choice"]),
    optionId,
  }),
  z.object({
    type: z.literal("matching"),
    pairs: z
      .array(z.tuple([optionId, optionId]))
      .min(1)
      .max(20),
  }),
  z.object({
    type: z.literal("ordering"),
    order: z.array(optionId).min(1).max(20),
  }),
  z.object({
    type: z.literal("pattern"),
    fills: z.array(optionId).min(1).max(20),
  }),
  z.object({
    type: z.literal("memory"),
    moves: z.number().int().min(0).max(500),
    pairs: z
      .array(z.tuple([optionId, optionId]))
      .min(1)
      .max(20),
  }),
]);

const submitSchema = z.object({
  sessionId: z.uuid(),
  questionId: slug,
  response: responseSchema,
  idempotencyKey: z.uuid(),
});

export type ActionFailure = { ok: false; code: string };

export type SubmitAnswerResult =
  | ({ ok: true; nextAction: "retry" | "continue" | "complete" } & GradeResult)
  | ActionFailure;

const attemptSchema = z.object({
  isCorrect: z.boolean(),
  canRetry: z.boolean(),
  nextAction: z.enum(["retry", "continue", "complete"]),
  feedback: z.object({ text: z.string() }),
  reveal: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("choice"), optionId: z.string() }),
      z.object({
        type: z.literal("matching"),
        pairs: z.array(z.tuple([z.string(), z.string()])),
      }),
      z.object({ type: z.literal("ordering"), order: z.array(z.string()) }),
      z.object({ type: z.literal("pattern"), fills: z.array(z.string()) }),
    ])
    .nullable(),
});

/** Session must belong to the selected child (RLS + explicit pin). */
async function ownSession(sessionId: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const child = await getSelectedChild();
  if (!child) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("learning_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("child_id", child.id)
    .maybeSingle();
  return data ? { supabase, child } : null;
}

export async function submitAnswerAction(
  input: z.input<typeof submitSchema>,
): Promise<SubmitAnswerResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { sessionId, questionId, response, idempotencyKey } = parsed.data;
  const ctx = await ownSession(sessionId);
  if (!ctx) return { ok: false, code: "forbidden" };
  const { data, error } = await ctx.supabase.rpc("submit_attempt", {
    p_session_id: sessionId,
    p_question_slug: questionId,
    p_response: response,
    p_idempotency_key: idempotencyKey,
  });
  if (error) return { ok: false, code: error.message };
  const r = attemptSchema.parse(data);
  return {
    ok: true,
    correct: r.isCorrect,
    final: !r.canRetry,
    message: r.feedback.text,
    reveal: (r.reveal ?? undefined) as Reveal | undefined,
    nextAction: r.nextAction,
  };
}

const hintSchema = z.object({ sessionId: z.uuid(), questionId: slug });

export async function requestHintAction(
  input: z.input<typeof hintSchema>,
): Promise<({ ok: true } & HintResult) | ActionFailure> {
  const parsed = hintSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const ctx = await ownSession(parsed.data.sessionId);
  if (!ctx) return { ok: false, code: "forbidden" };
  const { data, error } = await ctx.supabase.rpc("request_hint", {
    p_session_id: parsed.data.sessionId,
    p_question_slug: parsed.data.questionId,
  });
  if (error) return { ok: false, code: error.message };
  const h = z
    .object({ text: z.string(), eliminateOptionId: z.string().nullable() })
    .parse(data);
  return {
    ok: true,
    text: h.text,
    eliminateOptionId: h.eliminateOptionId ?? undefined,
  };
}

const startSchema = z.object({ lessonId: slug, restart: z.boolean() });

/** Starts (or resumes) a lesson for the selected child, then opens the player. */
export async function startLessonAction(
  input: z.input<typeof startSchema>,
): Promise<ActionFailure> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { lessonId, restart } = parsed.data;
  if (!(await getSessionUser()))
    redirect(`/auth/login?next=/student/lessons/${lessonId}`);
  const child = await getSelectedChild();
  if (!child) redirect("/student/profiles");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("start_session", {
    p_child_id: child.id,
    p_lesson_slug: lessonId,
    p_restart: restart,
  });
  if (error) return { ok: false, code: error.message };
  redirect(`/student/lessons/${lessonId}/play`);
}

/** Badges earned before now stop being highlighted as new. */
export async function markRewardsSeenAction(): Promise<void> {
  if (!(await getSessionUser())) return;
  const child = await getSelectedChild();
  if (!child) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("children")
    .update({ rewards_seen_at: new Date().toISOString() })
    .eq("id", child.id);
}

// ── Placement activity (PRD P4) ─────────────────────────────────────────

const placementStartSchema = z.object({
  childId: z.uuid(),
  activityId: slug,
  restart: z.boolean(),
});

/**
 * Parent-side start: the parent chose the child on their own page, so this
 * also selects that child for the child area, then opens the activity.
 */
export async function startPlacementAction(
  input: z.input<typeof placementStartSchema>,
): Promise<ActionFailure> {
  const parsed = placementStartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { childId, activityId, restart } = parsed.data;
  if (!(await getSessionUser()))
    redirect(`/auth/login?next=/parent/children/${childId}/discover`);
  const child = await getChild(childId);
  if (!child || child.status !== "active")
    return { ok: false, code: "forbidden" };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("start_assessment", {
    p_child_id: child.id,
    p_assessment_slug: activityId,
    p_restart: restart,
  });
  if (error) return { ok: false, code: error.message };
  (await cookies()).set(
    SELECTED_CHILD_COOKIE,
    child.id,
    SELECTED_CHILD_COOKIE_OPTIONS,
  );
  redirect(`/student/discover/${activityId}`);
}

const placementSubmitSchema = z.object({
  runId: z.uuid(),
  questionId: slug,
  response: responseSchema,
  idempotencyKey: z.uuid(),
});

export type SubmitPlacementResult =
  { ok: true; nextAction: "continue" | "complete" } | ActionFailure;

/** Records one placement answer. The child gets no correctness feedback. */
export async function submitPlacementAction(
  input: z.input<typeof placementSubmitSchema>,
): Promise<SubmitPlacementResult> {
  const parsed = placementSubmitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const { runId, questionId, response, idempotencyKey } = parsed.data;
  if (!(await getSessionUser())) return { ok: false, code: "forbidden" };
  const child = await getSelectedChild();
  if (!child) return { ok: false, code: "forbidden" };
  const supabase = await createSupabaseServerClient();
  // Pin the run to the selected child (RLS + explicit filter).
  const { data: owned } = await supabase
    .from("assessment_runs")
    .select("id")
    .eq("id", runId)
    .eq("child_id", child.id)
    .maybeSingle();
  if (!owned) return { ok: false, code: "forbidden" };
  const { data, error } = await supabase.rpc("submit_assessment_item", {
    p_run_id: runId,
    p_question_slug: questionId,
    p_response: response,
    p_idempotency_key: idempotencyKey,
  });
  if (error) return { ok: false, code: error.message };
  const r = z
    .object({ nextAction: z.enum(["continue", "complete"]) })
    .parse(data);
  return { ok: true, nextAction: r.nextAction };
}
