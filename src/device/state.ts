import { z } from "zod";

import { childPreferencesSchema } from "@/features/family/schemas";

/**
 * Everything the device edition stores, in one JSON document in
 * localStorage. Validated on load and on backup import.
 */

const iso = z.string().min(10).max(40);
const id = z.string().min(1).max(64);
const status = z.enum(["in_progress", "completed", "abandoned"]);

export const childSchema = z.object({
  id,
  nickname: z.string().min(1).max(20),
  avatarKey: z.string().regex(/^[a-z0-9-]{1,32}$/),
  birthYear: z.number().int().nullable(),
  preferences: childPreferencesSchema,
  status: z.enum(["active", "archived"]),
  createdAt: iso,
  archivedAt: iso.nullable(),
  rewardsSeenAt: iso.nullable(),
});

export const sessionSchema = z.object({
  id,
  childId: id,
  lessonId: id,
  status,
  currentIndex: z.number().int().min(0),
  total: z.number().int().min(1),
  correct: z.number().int(),
  incorrect: z.number().int(),
  firstTry: z.number().int(),
  score: z.number(),
  maxScore: z.number(),
  stars: z.number().int().min(0).max(3).nullable(),
  startedAt: iso,
  updatedAt: iso,
  completedAt: iso.nullable(),
  abandonedAt: iso.nullable(),
});

export const attemptSchema = z.object({
  sessionId: id,
  childId: id,
  questionId: id,
  skillId: id,
  attemptNo: z.number().int().min(1).max(10),
  response: z.unknown(),
  isCorrect: z.boolean(),
  score: z.number(),
  maxScore: z.number(),
  isFinal: z.boolean(),
  feedback: z.string(),
  createdAt: iso,
});

export const progressSchema = z.object({
  childId: id,
  lessonId: id,
  bestStars: z.number().int().min(0).max(3),
  completions: z.number().int().min(1),
  lastSessionId: id.nullable(),
  firstCompletedAt: iso,
  lastCompletedAt: iso,
});

export const masterySchema = z.object({
  childId: id,
  skillId: id,
  state: z.enum([
    "not_started",
    "learning",
    "practicing",
    "mastered",
    "review",
  ]),
  accuracy: z.number().min(0).max(1),
  evidence: z.number().int(),
  distinct: z.number().int(),
  sessions: z.number().int(),
  masteredAt: iso.nullable(),
  lastPracticedAt: iso.nullable(),
});

export const rewardSchema = z.object({
  childId: id,
  rewardId: id,
  sessionId: id.nullable(),
  reason: z.string(),
  grantedAt: iso,
});

export const planSchema = z.object({
  childId: id,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lessonIds: z.array(id).min(1).max(5),
});

export const runSchema = z.object({
  id,
  childId: id,
  assessmentId: id,
  status,
  currentIndex: z.number().int().min(0),
  total: z.number().int().min(1),
  startedAt: iso,
  completedAt: iso.nullable(),
  abandonedAt: iso.nullable(),
});

export const runAnswerSchema = z.object({
  runId: id,
  childId: id,
  questionId: id,
  response: z.unknown(),
  isCorrect: z.boolean(),
  createdAt: iso,
});

export const deviceStateSchema = z.object({
  format: z.literal("little-device"),
  version: z.literal(1),
  createdAt: iso,
  lastBackupAt: iso.nullable(),
  selectedChildId: id.nullable(),
  children: z.array(childSchema).max(50),
  sessions: z.array(sessionSchema),
  attempts: z.array(attemptSchema),
  progress: z.array(progressSchema),
  mastery: z.array(masterySchema),
  rewards: z.array(rewardSchema),
  plans: z.array(planSchema),
  runs: z.array(runSchema),
  runAnswers: z.array(runAnswerSchema),
});

export type DeviceState = z.infer<typeof deviceStateSchema>;
export type DeviceChild = z.infer<typeof childSchema>;
export type DSession = z.infer<typeof sessionSchema>;
export type DAttempt = z.infer<typeof attemptSchema>;
export type DRun = z.infer<typeof runSchema>;

export function emptyState(now: string): DeviceState {
  return {
    format: "little-device",
    version: 1,
    createdAt: now,
    lastBackupAt: null,
    selectedChildId: null,
    children: [],
    sessions: [],
    attempts: [],
    progress: [],
    mastery: [],
    rewards: [],
    plans: [],
    runs: [],
    runAnswers: [],
  };
}
