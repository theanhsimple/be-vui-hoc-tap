import { DEMO_ANSWER_KEYS } from "@/data/demo/answer-keys";
import { PLACEMENT_ASSESSMENT, SKILL_GUIDES } from "@/data/demo/parent-guides";
import { demoContentRepository } from "@/data/demo/repository";
import { REWARD_RULES, type RewardRule } from "@/data/demo/reward-rules";
import type { AnswerKey } from "@/features/learning/grading/keys";
import { REWARDS } from "@/features/learning/progress/rewards";
import type {
  Catalog,
  LearningQuestion,
  Lesson,
} from "@/features/learning/types";

/**
 * DEVICE EDITION content: the reviewed demo library, bundled into the app
 * (no server). Answer keys ship with it by design (D-056) — fine for a
 * family's own device, NOT a security boundary.
 */

export interface QuestionInfo {
  question: LearningQuestion;
  key: AnswerKey;
  skillId: string;
  worldId: string;
}

export interface DeviceContent {
  catalog: Catalog;
  lesson(id: string): Lesson | undefined;
  info(questionId: string): QuestionInfo | undefined;
  /** Lessons of a skill in order (for unlocking). */
  lessonOrder: Array<{
    id: string;
    skillId: string;
    worldId: string;
    prevId: string | null;
  }>;
  worldUnlock: Record<string, number | null>;
  rewards: Array<{ id: string; criteria: string; rule: RewardRule }>;
  placement: {
    id: string;
    title: string;
    intro: string;
    questions: LearningQuestion[];
  };
  guides: Record<string, { summary: string; homeActivity: string }>;
}

function build(): DeviceContent {
  const catalog = demoContentRepository.getCatalog();
  const lessons = new Map<string, Lesson>();
  const infos = new Map<string, QuestionInfo>();
  const lessonOrder: DeviceContent["lessonOrder"] = [];
  for (const w of catalog.worlds) {
    for (const s of w.skills) {
      let prev: string | null = null;
      for (const l of s.lessons) {
        const full = demoContentRepository.getLesson(l.id)!;
        lessons.set(l.id, full);
        lessonOrder.push({
          id: l.id,
          skillId: s.id,
          worldId: w.id,
          prevId: prev,
        });
        prev = l.id;
        for (const q of full.questions) {
          const key = DEMO_ANSWER_KEYS[q.id];
          if (!key) throw new Error(`missing key ${q.id}`);
          if (!infos.has(q.id))
            infos.set(q.id, { question: q, key, skillId: s.id, worldId: w.id });
        }
      }
    }
  }
  return {
    catalog,
    lesson: (id) => lessons.get(id),
    info: (id) => infos.get(id),
    lessonOrder,
    worldUnlock: Object.fromEntries(
      catalog.worlds.map((w) => [w.id, w.unlock?.minCompletedLessons ?? null]),
    ),
    rewards: REWARDS.map((r) => {
      const rule = REWARD_RULES[r.id];
      if (!rule) throw new Error(`missing reward rule ${r.id}`);
      return { id: r.id, criteria: r.criteria, rule };
    }),
    placement: {
      id: PLACEMENT_ASSESSMENT.slug,
      title: PLACEMENT_ASSESSMENT.title,
      intro: PLACEMENT_ASSESSMENT.intro,
      questions: PLACEMENT_ASSESSMENT.questionSlugs.map((s) => {
        const i = infos.get(s);
        if (!i) throw new Error(`placement question ${s} missing`);
        return i.question;
      }),
    },
    guides: SKILL_GUIDES,
  };
}

let cached: DeviceContent | null = null;
export function deviceContent(): DeviceContent {
  cached ??= build();
  return cached;
}
