import { allLessons } from "../content/repository";
import type { Catalog, LessonSummary, World } from "../types";
import type {
  ChildProgress,
  LessonRecord,
  QuestionResult,
  RewardId,
} from "./model";
import { newlyEarned } from "./rewards";

// ── Stars ───────────────────────────────────────────────────────────────

/**
 * Effort-based stars (DECISIONS D-032): finishing a lesson always earns 1;
 * +1 when at least half the questions were right on the first try;
 * +1 when every question was right on the first try.
 */
export function starsFor(results: readonly QuestionResult[]): number {
  if (results.length === 0) return 0;
  const first = results.filter((r) => r.firstTry).length;
  return (
    1 +
    (first >= Math.ceil(results.length / 2) ? 1 : 0) +
    (first === results.length ? 1 : 0)
  );
}

export function totalStars(p: ChildProgress): number {
  return Object.values(p.lessons).reduce((sum, l) => sum + l.bestStars, 0);
}

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function starsOnDay(p: ChildProgress, day: string): number {
  return p.history.reduce(
    (sum, e) =>
      e.type === "lesson" && dateKey(new Date(e.at)) === day
        ? sum + e.stars
        : sum,
    0,
  );
}

// ── Progression (DECISIONS D-031) ───────────────────────────────────────

export type WorldState = "locked" | "available" | "completed";
export type LessonState = "locked" | "available" | "completed";

export const completedCount = (p: ChildProgress) =>
  Object.keys(p.lessons).length;

export function worldProgress(
  world: World,
  p: ChildProgress,
): { completed: number; total: number } {
  const lessons = world.skills.flatMap((s) => s.lessons);
  return {
    completed: lessons.filter((l) => p.lessons[l.id]).length,
    total: lessons.length,
  };
}

/** Challenge Arena opens after a few lessons elsewhere; other worlds are always open. */
export function worldState(world: World, p: ChildProgress): WorldState {
  if (world.unlock && completedCount(p) < world.unlock.minCompletedLessons)
    return "locked";
  const { completed, total } = worldProgress(world, p);
  return completed === total ? "completed" : "available";
}

/** Within a skill, lessons follow their difficulty order: the next one opens when the previous is done. */
export function lessonState(
  world: World,
  lessonId: string,
  p: ChildProgress,
): LessonState {
  if (p.lessons[lessonId]) return "completed";
  if (worldState(world, p) === "locked") return "locked";
  for (const skill of world.skills) {
    const i = skill.lessons.findIndex((l) => l.id === lessonId);
    if (i === -1) continue;
    return i === 0 || p.lessons[skill.lessons[i - 1]!.id]
      ? "available"
      : "locked";
  }
  return "locked";
}

// ── Daily plan ──────────────────────────────────────────────────────────

const PLAN_SIZE = 3;

/**
 * Today's suggestion: the next open lesson from different worlds, rotating
 * the starting world by day so the mix changes. Falls back to review of
 * completed lessons when everything is done. Never penalises missed days.
 */
export function buildDailyPlan(
  catalog: Catalog,
  p: ChildProgress,
  day: string,
): string[] {
  const dayIndex = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  const worlds = catalog.worlds;
  const rotated = worlds.map((_, i) => worlds[(i + dayIndex) % worlds.length]!);
  const plan: string[] = [];
  for (const w of rotated) {
    if (plan.length >= PLAN_SIZE) break;
    const next = w.skills
      .flatMap((s) => s.lessons)
      .find((l) => lessonState(w, l.id, p) === "available");
    if (next) plan.push(next.id);
  }
  if (plan.length < PLAN_SIZE) {
    for (const l of allLessons(catalog)) {
      if (plan.length >= PLAN_SIZE) break;
      if (!plan.includes(l.id) && p.lessons[l.id]) plan.push(l.id);
    }
  }
  return plan;
}

// ── Recording a finished lesson ─────────────────────────────────────────

export interface CompletionOutcome {
  progress: ChildProgress;
  record: LessonRecord;
  newRewards: RewardId[];
}

/** Pure: returns the next progress state after a lesson is finished. */
export function recordLessonCompletion(
  catalog: Catalog,
  p: ChildProgress,
  lesson: LessonSummary,
  results: readonly QuestionResult[],
  now: Date,
): CompletionOutcome {
  const at = now.toISOString();
  const stars = starsFor(results);
  const prev = p.lessons[lesson.id];
  const base: ChildProgress = {
    ...p,
    inProgress: p.inProgress?.lessonId === lesson.id ? undefined : p.inProgress,
    lessons: {
      ...p.lessons,
      [lesson.id]: {
        lessonId: lesson.id,
        worldId: lesson.worldId,
        firstCompletedAt: prev?.firstCompletedAt ?? at,
        lastCompletedAt: at,
        bestStars: Math.max(prev?.bestStars ?? 0, stars),
        plays: (prev?.plays ?? 0) + 1,
        last: {
          stars,
          total: results.length,
          correct: results.filter((r) => r.correct).length,
          firstTry: results.filter((r) => r.firstTry).length,
          newRewards: [],
        },
      },
    },
    history: [...p.history, { type: "lesson", lessonId: lesson.id, stars, at }],
  };
  const newRewards = newlyEarned(base, catalog);
  const record: LessonRecord = {
    ...base.lessons[lesson.id]!,
    last: { ...base.lessons[lesson.id]!.last, newRewards },
  };
  return {
    record,
    newRewards,
    progress: {
      ...base,
      lessons: { ...base.lessons, [lesson.id]: record },
      rewards: [
        ...base.rewards,
        ...newRewards.map((id) => ({ id, earnedAt: at })),
      ],
      history: [
        ...base.history,
        ...newRewards.map((rewardId) => ({
          type: "badge" as const,
          rewardId,
          at,
        })),
      ],
    },
  };
}

// ── Greeting ────────────────────────────────────────────────────────────

export function greeting(hour: number): string {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}
