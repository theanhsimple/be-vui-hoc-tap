import { notFound } from "next/navigation";

import { contentRepository } from "@/features/learning/content/repository";

export function lessonParams() {
  return contentRepository.listLessonIds().map((lessonId) => ({ lessonId }));
}

/** Loads a lesson and its world, or 404s. Server only. */
export function loadLesson(lessonId: string) {
  const lesson = contentRepository.getLesson(lessonId);
  const world = lesson && contentRepository.getWorld(lesson.worldId);
  if (!lesson || !world) notFound();
  return { lesson, world };
}
