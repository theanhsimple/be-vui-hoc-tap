import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { BrandTone } from "@/design-system/tokens";
import type { IllustrationName } from "@/illustrations/registry";
import { createSupabasePublicClient } from "@/lib/supabase/server";

import type {
  Catalog,
  Difficulty,
  LearningQuestion,
  Lesson,
  LessonSummary,
  QuestionOption,
  Visual,
  World,
} from "../types";

/**
 * Published learning content from PostgreSQL (Supabase). Content is public
 * (RLS: status = 'published'), contains no answer keys, and is identical for
 * every family — so it is read with a session-less client and cached.
 * Publishing tools must call revalidateTag(CONTENT_TAG).
 */

export const CONTENT_TAG = "learning-content";

const DIFFICULTY: Record<number, Difficulty> = {
  1: "L1",
  2: "L2",
  3: "L3",
  4: "L4",
};

export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("minutes");

  const db = createSupabasePublicClient();
  const { data, error } = await db
    .from("modules")
    .select(
      `slug, title_vi, title_en, category, description, tone, illustration, unlock_min_completed_lessons,
       skills ( slug, title_vi, sort_order,
         lessons ( slug, title_vi, objective_vi, minutes, cover, sort_order, lesson_questions ( position ) ) )`,
    )
    .order("sort_order")
    .order("sort_order", { referencedTable: "skills" })
    .order("sort_order", { referencedTable: "skills.lessons" });
  if (error)
    throw new Error(`catalog query failed: ${error.code} ${error.message}`);

  const worlds: World[] = (data ?? []).map((m) => ({
    id: m.slug,
    nameVi: m.title_vi,
    nameEn: m.title_en,
    category: m.category,
    description: m.description,
    tone: m.tone as BrandTone,
    illustration: m.illustration as IllustrationName,
    unlock: m.unlock_min_completed_lessons
      ? { minCompletedLessons: m.unlock_min_completed_lessons }
      : undefined,
    skills: m.skills.map((s) => ({
      id: s.slug,
      worldId: m.slug,
      title: s.title_vi,
      lessons: s.lessons.map((l): LessonSummary => ({
        id: l.slug,
        worldId: m.slug,
        skillId: s.slug,
        title: l.title_vi,
        objective: l.objective_vi,
        minutes: l.minutes,
        cover: l.cover as unknown as Visual,
        questionCount: l.lesson_questions.length,
      })),
    })),
  }));
  return { worlds };
}

type QuestionRow = {
  slug: string;
  type: LearningQuestion["type"];
  difficulty: number;
  prompt_vi: string;
  instruction_audio_url: string | null;
  stimulus: unknown;
  memorize: unknown;
  feedback: unknown;
  config: unknown;
  max_attempts: number;
};

/** Row → public question model. Throws on content that the UI cannot render. */
export function toQuestion(row: QuestionRow): LearningQuestion {
  const config = (row.config ?? {}) as Record<string, unknown>;
  const base = {
    id: row.slug,
    prompt: row.prompt_vi,
    difficulty: DIFFICULTY[row.difficulty] ?? "L1",
    instructionAudioUrl: row.instruction_audio_url ?? undefined,
    stimulus: (row.stimulus ?? undefined) as Visual | undefined,
    memorize: (row.memorize ?? undefined) as LearningQuestion["memorize"],
    feedback: (row.feedback ?? undefined) as LearningQuestion["feedback"],
    maxAttempts: row.max_attempts,
  };
  const need = (key: string) => {
    if (!Array.isArray(config[key]))
      throw new Error(`question ${row.slug}: config.${key} missing`);
    return config[key];
  };
  switch (row.type) {
    case "single_choice":
      return {
        ...base,
        type: "single_choice",
        options: need("options") as QuestionOption[],
        config: { confirm: config.confirm === true },
      };
    case "image_choice":
      return {
        ...base,
        type: "image_choice",
        options: need("options") as QuestionOption[],
      };
    case "matching":
      need("left");
      need("right");
      return { ...base, type: "matching", config: config as never };
    case "ordering":
      need("items");
      return { ...base, type: "ordering", config: config as never };
    case "pattern":
      need("sequence");
      need("palette");
      return { ...base, type: "pattern", config: config as never };
    case "memory":
      need("cards");
      return { ...base, type: "memory", config: config as never };
  }
}

/** A published lesson with its ordered public questions, or null. */
export async function getLesson(lessonId: string): Promise<Lesson | null> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("minutes");

  if (!/^[a-z0-9-]{1,64}$/.test(lessonId)) return null;
  const db = createSupabasePublicClient();
  const { data, error } = await db
    .from("lessons")
    .select(
      `slug, title_vi, objective_vi, minutes, cover,
       skills ( slug, modules ( slug ) ),
       lesson_questions ( position, questions ( slug, type, difficulty, prompt_vi, instruction_audio_url, stimulus, memorize, feedback, config, max_attempts ) )`,
    )
    .eq("slug", lessonId)
    .order("position", { referencedTable: "lesson_questions" })
    .maybeSingle();
  if (error)
    throw new Error(`lesson query failed: ${error.code} ${error.message}`);
  if (!data?.skills?.modules) return null;
  const questions = data.lesson_questions
    .map((lq) => lq.questions)
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map(toQuestion);
  return {
    id: data.slug,
    worldId: data.skills.modules.slug,
    skillId: data.skills.slug,
    title: data.title_vi,
    objective: data.objective_vi,
    minutes: data.minutes,
    cover: data.cover as unknown as Visual,
    questionCount: questions.length,
    questions,
  };
}

export interface SkillGuide {
  summary: string;
  homeActivity: string;
}

/** Parent-facing texts per published skill slug (public content, cached). */
export async function getSkillGuides(): Promise<Record<string, SkillGuide>> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("minutes");

  const db = createSupabasePublicClient();
  const { data, error } = await db
    .from("skills")
    .select("slug, parent_summary_vi, home_activity_vi");
  if (error)
    throw new Error(`skill guide query failed: ${error.code} ${error.message}`);
  return Object.fromEntries(
    (data ?? []).map((s) => [
      s.slug,
      { summary: s.parent_summary_vi, homeActivity: s.home_activity_vi },
    ]),
  );
}

export interface PlacementActivity {
  id: string;
  title: string;
  intro: string;
  questions: LearningQuestion[];
}

/** A published placement activity with its ordered public questions. */
export async function getPlacement(
  slug: string,
): Promise<PlacementActivity | null> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("minutes");

  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return null;
  const db = createSupabasePublicClient();
  const { data, error } = await db
    .from("assessments")
    .select(
      `slug, title_vi, intro_vi,
       assessment_items ( position, questions ( slug, type, difficulty, prompt_vi, instruction_audio_url, stimulus, memorize, feedback, config, max_attempts ) )`,
    )
    .eq("slug", slug)
    .order("position", { referencedTable: "assessment_items" })
    .maybeSingle();
  if (error)
    throw new Error(`placement query failed: ${error.code} ${error.message}`);
  if (!data) return null;
  return {
    id: data.slug,
    title: data.title_vi,
    intro: data.intro_vi,
    questions: data.assessment_items
      .map((i) => i.questions)
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .map(toQuestion),
  };
}
