import "server-only";

import { notFound } from "next/navigation";

import { findWorld } from "@/features/learning/content/catalog";
import { getCatalog, getLesson } from "@/features/learning/backend/content";
import type { LessonSummary } from "@/features/learning/types";

/** A published lesson with its world, or the friendly 404. */
export async function loadLesson(lessonId: string) {
  const [lesson, catalog] = await Promise.all([
    getLesson(lessonId),
    getCatalog(),
  ]);
  const world = lesson && findWorld(catalog, lesson.worldId);
  if (!lesson || !world) notFound();
  const { questions, ...summary } = lesson;
  return { lesson, summary: summary satisfies LessonSummary, questions, world };
}
