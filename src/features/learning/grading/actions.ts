"use server";

import { z } from "zod";

import { getDemoAnswerKey } from "@/data/demo/answer-keys";

import { contentRepository } from "../content/repository";
import type { GradeResult, HintResult } from "../types";
import { gradeResponse, responseMatchesQuestion } from "./grade";

/**
 * Server Actions for grading. They are public POST endpoints, so every input
 * is validated. Answer keys live only on the server.
 *
 * DEMO LIMITATION: attempts are counted by the client and nothing is stored.
 * In Sprint 04 these become RPCs (submit_attempt) that check the guardian's
 * session, count attempts in question_attempts and update skill_mastery.
 */

const id = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/i);

const responseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.enum(["single_choice", "image_choice"]), optionId: id }),
  z.object({
    type: z.literal("matching"),
    pairs: z.array(z.tuple([id, id])).max(10),
  }),
  z.object({ type: z.literal("ordering"), order: z.array(id).max(10) }),
  z.object({ type: z.literal("pattern"), fills: z.array(id).max(10) }),
  z.object({
    type: z.literal("memory"),
    moves: z.number().int().min(0).max(500),
  }),
]);

const submitSchema = z.object({
  lessonId: id,
  questionId: id,
  attempt: z.number().int().min(1).max(10),
  response: responseSchema,
});

const hintSchema = z.object({ lessonId: id, questionId: id });

export type SubmitAnswerInput = z.input<typeof submitSchema>;

function findQuestion(lessonId: string, questionId: string) {
  return contentRepository
    .getLesson(lessonId)
    ?.questions.find((q) => q.id === questionId);
}

export async function submitAnswer(
  input: SubmitAnswerInput,
): Promise<GradeResult> {
  const { lessonId, questionId, attempt, response } = submitSchema.parse(input);
  const question = findQuestion(lessonId, questionId);
  const key = getDemoAnswerKey(questionId);
  if (!question || !key) throw new Error("Unknown question");
  if (!responseMatchesQuestion(question, response))
    throw new Error("Invalid response");
  return gradeResponse(question, key, response, attempt);
}

export async function requestHint(
  input: z.input<typeof hintSchema>,
): Promise<HintResult> {
  const { lessonId, questionId } = hintSchema.parse(input);
  const question = findQuestion(lessonId, questionId);
  if (!question) throw new Error("Unknown question");
  const key = getDemoAnswerKey(questionId);
  const text = question.feedback?.hint ?? "Con nhìn thật kỹ từng hình nhé.";
  return {
    text,
    eliminateOptionId: key?.type === "choice" ? key.hintEliminate : undefined,
  };
}
