import { z } from "zod";

import { AVATAR_KEYS, type AvatarKey } from "@/components/ui/LittleAvatar";

import type { LessonState, WorldState } from "../progress/calc";
import type {
  ChildProgress,
  HistoryEvent,
  InProgressSession,
  LessonRecord,
  RewardId,
} from "../progress/model";
import { REWARDS } from "../progress/rewards";
import type { Catalog } from "../types";

/**
 * Validates the JSON returned by the database RPCs and maps it to the view
 * model the student screens use. Pure (no I/O) so it is unit-tested.
 */

const state3 = z.enum(["locked", "available", "completed"]);

export const sessionStateSchema = z.object({
  sessionId: z.uuid(),
  lessonId: z.string(),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  currentIndex: z.number().int().min(0),
  total: z.number().int().min(1),
  startedAt: z.string(),
  attempt: z.number().int().min(1),
  results: z.array(
    z.object({
      questionId: z.string(),
      correct: z.boolean(),
      firstTry: z.boolean(),
      attempts: z.number().int(),
    }),
  ),
});
export type SessionState = z.infer<typeof sessionStateSchema>;

export const overviewSchema = z.object({
  child: z.object({
    id: z.uuid(),
    nickname: z.string(),
    avatarKey: z.string(),
    rewardsSeenAt: z.string().nullable(),
  }),
  modules: z.array(
    z.object({
      id: z.string(),
      state: state3,
      completed: z.number().int(),
      total: z.number().int(),
    }),
  ),
  lessons: z.array(
    z.object({
      id: z.string(),
      state: state3,
      record: z
        .object({
          bestStars: z.number().int(),
          plays: z.number().int(),
          firstCompletedAt: z.string(),
          lastCompletedAt: z.string(),
          last: z
            .object({
              stars: z.number().int(),
              total: z.number().int(),
              correct: z.number().int(),
              firstTry: z.number().int(),
              newRewards: z.array(z.string()),
            })
            .nullable(),
        })
        .nullable(),
    }),
  ),
  rewards: z.array(
    z.object({ id: z.string(), earnedAt: z.string(), reason: z.string() }),
  ),
  history: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("lesson"),
        lessonId: z.string(),
        stars: z.number().int(),
        at: z.string(),
      }),
      z.object({
        type: z.literal("badge"),
        rewardId: z.string(),
        at: z.string(),
      }),
    ]),
  ),
  inProgress: sessionStateSchema.nullable(),
  mastery: z.array(
    z.object({
      skillId: z.string(),
      state: z.enum([
        "not_started",
        "learning",
        "practicing",
        "mastered",
        "review",
      ]),
      accuracy: z.number(),
      evidence: z.number().int(),
      lastPracticedAt: z.string().nullable(),
    }),
  ),
});
export type Overview = z.infer<typeof overviewSchema>;

export const sessionResultSchema = z.object({
  sessionId: z.uuid(),
  lessonId: z.string(),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  stars: z.number().int(),
  total: z.number().int(),
  correct: z.number().int(),
  firstTry: z.number().int(),
  completedAt: z.string().nullable(),
  newRewards: z.array(z.string()),
});
export type SessionResult = z.infer<typeof sessionResultSchema>;

const KNOWN_REWARDS = new Set<string>(REWARDS.map((r) => r.id));
const isReward = (id: string): id is RewardId => KNOWN_REWARDS.has(id);

export interface StudentChild {
  id: string;
  nickname: string;
  avatar: AvatarKey;
  preferences: { voice: boolean; sounds: boolean };
}

/** Everything the child-facing screens need, computed on the server. */
export interface StudentView {
  child: StudentChild;
  progress: ChildProgress;
  worldStates: Record<
    string,
    { state: WorldState; completed: number; total: number }
  >;
  lessonStates: Record<string, LessonState>;
  /** Server clock in the app time zone (avoids hydration mismatches). */
  today: { date: string; hour: number };
  starsToday: number;
}

export function toInProgress(s: SessionState): InProgressSession {
  return {
    lessonId: s.lessonId,
    questionIndex: s.currentIndex,
    results: s.results,
    attempt: s.attempt,
    startedAt: s.startedAt,
  };
}

export function toChildProgress(
  overview: Overview,
  catalog: Catalog,
  dailyPlan?: { date: string; lessonIds: string[] },
): ChildProgress {
  const worldOf = new Map(
    catalog.worlds.flatMap((w) =>
      w.skills.flatMap((s) => s.lessons.map((l) => [l.id, w.id] as const)),
    ),
  );
  const lessons: Record<string, LessonRecord> = {};
  for (const l of overview.lessons) {
    if (!l.record) continue;
    const last = l.record.last ?? {
      stars: l.record.bestStars,
      total: 0,
      correct: 0,
      firstTry: 0,
      newRewards: [],
    };
    lessons[l.id] = {
      lessonId: l.id,
      worldId: worldOf.get(l.id) ?? "",
      firstCompletedAt: l.record.firstCompletedAt,
      lastCompletedAt: l.record.lastCompletedAt,
      bestStars: l.record.bestStars,
      plays: l.record.plays,
      last: { ...last, newRewards: last.newRewards.filter(isReward) },
    };
  }
  const history: HistoryEvent[] = overview.history.flatMap(
    (e): HistoryEvent[] =>
      e.type === "lesson"
        ? [e]
        : isReward(e.rewardId)
          ? [{ type: "badge", rewardId: e.rewardId, at: e.at }]
          : [],
  );
  return {
    lessons,
    inProgress: overview.inProgress
      ? toInProgress(overview.inProgress)
      : undefined,
    rewards: overview.rewards.flatMap((r) =>
      isReward(r.id) ? [{ id: r.id, earnedAt: r.earnedAt }] : [],
    ),
    history,
    dailyPlan,
    rewardsSeenAt: overview.child.rewardsSeenAt ?? undefined,
  };
}

export function toAvatar(key: string): AvatarKey {
  return (AVATAR_KEYS as readonly string[]).includes(key)
    ? (key as AvatarKey)
    : "sun";
}
