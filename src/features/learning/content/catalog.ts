import type { Catalog, LessonSummary, World } from "../types";

// ── Catalog helpers (pure, client-safe) ─────────────────────────────────

export function allLessons(catalog: Catalog): LessonSummary[] {
  return catalog.worlds.flatMap((w) => w.skills.flatMap((s) => s.lessons));
}

export function findLesson(
  catalog: Catalog,
  lessonId: string,
): LessonSummary | undefined {
  return allLessons(catalog).find((l) => l.id === lessonId);
}

export function findWorld(
  catalog: Catalog,
  worldId: string,
): World | undefined {
  return catalog.worlds.find((w) => w.id === worldId);
}
