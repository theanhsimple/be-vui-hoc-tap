import { DEMO_WORLD_SOURCES } from "@/data/demo";
import type { WorldSource } from "@/data/demo/helpers";
import { LEARNING_WORLDS } from "@/design-system/worlds";

import type { Catalog, Lesson, LessonSummary, World } from "../types";

/**
 * Content access for the student experience. Today backed by local demo
 * files; in Sprint 04 a Supabase implementation (published content only,
 * RLS-protected) replaces it behind the same interface.
 */
export interface ContentRepository {
  getCatalog(): Catalog;
  getWorld(worldId: string): World | undefined;
  getLesson(lessonId: string): Lesson | undefined;
  listLessonIds(): string[];
}

function buildDemo(sources: readonly WorldSource[]) {
  const lessons = new Map<string, Lesson>();
  const worlds: World[] = sources.map((src) => {
    const visual = LEARNING_WORLDS.find((w) => w.id === src.id);
    if (!visual) throw new Error(`Unknown world id in demo content: ${src.id}`);
    return {
      id: src.id,
      nameVi: visual.nameVi,
      nameEn: visual.nameEn,
      tone: visual.tone,
      illustration: visual.illustration,
      category: src.category,
      description: src.description,
      unlock: src.unlock,
      skills: src.skills.map((skill) => ({
        id: skill.id,
        worldId: src.id,
        title: skill.title,
        lessons: skill.lessons.map((l): LessonSummary => {
          const full: Lesson = {
            id: l.id,
            worldId: src.id,
            skillId: skill.id,
            title: l.title,
            objective: l.objective,
            minutes: l.minutes,
            cover: l.cover,
            questionCount: l.questions.length,
            questions: l.questions,
          };
          lessons.set(l.id, full);
          const { questions: _omit, ...summary } = full;
          void _omit;
          return summary;
        }),
      })),
    };
  });
  return { catalog: { worlds }, lessons };
}

const demo = buildDemo(DEMO_WORLD_SOURCES);

export const demoContentRepository: ContentRepository = {
  getCatalog: () => demo.catalog,
  getWorld: (id) => demo.catalog.worlds.find((w) => w.id === id),
  getLesson: (id) => demo.lessons.get(id),
  listLessonIds: () => [...demo.lessons.keys()],
};

/** The repository the app uses. Swap here when the Supabase implementation lands. */
export const contentRepository: ContentRepository = demoContentRepository;

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
