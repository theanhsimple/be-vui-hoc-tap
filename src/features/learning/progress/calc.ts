import { allLessons } from "../content/catalog";
import type { Catalog } from "../types";
import type { ChildProgress } from "./model";

/**
 * Display helpers. Authoritative progress — stars, lesson/world unlocking,
 * completion, rewards, mastery — is computed by the database
 * (supabase/migrations/…_learning_engine.sql) and delivered in the student
 * overview. Nothing here decides what a child has earned or may open.
 */

export type WorldState = "locked" | "available" | "completed";
export type LessonState = "locked" | "available" | "completed";

/** The product's reference time zone (Vietnam-first; DECISIONS D-045). */
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** YYYY-MM-DD of an instant in a time zone. */
export function dateKeyIn(date: Date, timeZone = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function hourIn(date: Date, timeZone = APP_TIME_ZONE): number {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return Number(h);
}

export function totalStars(p: ChildProgress): number {
  return Object.values(p.lessons).reduce((sum, l) => sum + l.bestStars, 0);
}

export function starsOnDay(
  p: ChildProgress,
  day: string,
  timeZone = APP_TIME_ZONE,
): number {
  return p.history.reduce(
    (sum, e) =>
      e.type === "lesson" && dateKeyIn(new Date(e.at), timeZone) === day
        ? sum + e.stars
        : sum,
    0,
  );
}

// ── Daily plan ──────────────────────────────────────────────────────────

const PLAN_SIZE = 3;

/**
 * Today's suggestion: the next open lesson from different worlds, rotating
 * the starting world by day so the mix changes. Falls back to review of
 * completed lessons when everything is done. Never penalises missed days.
 * Uses the server's lesson states; the plan is then stored for the day.
 */
export function buildDailyPlan(
  catalog: Catalog,
  lessonStates: Readonly<Record<string, LessonState>>,
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
      .find((l) => lessonStates[l.id] === "available");
    if (next) plan.push(next.id);
  }
  if (plan.length < PLAN_SIZE) {
    for (const l of allLessons(catalog)) {
      if (plan.length >= PLAN_SIZE) break;
      if (!plan.includes(l.id) && lessonStates[l.id] === "completed")
        plan.push(l.id);
    }
  }
  return plan;
}

// ── Greeting ────────────────────────────────────────────────────────────

export function greeting(hour: number): string {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}
