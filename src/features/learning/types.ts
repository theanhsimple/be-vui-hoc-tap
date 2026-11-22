import type { BrandTone } from "@/design-system/tokens";
import type { IllustrationName } from "@/illustrations/registry";

/**
 * Public learning-content model (safe to send to the student's device).
 * Maps to DATABASE_SCHEMA.md: World → modules, Skill → skills,
 * Lesson → lessons, LearningQuestion → questions (+ lesson_questions).
 * Answer keys are NOT part of this model — see grading/ (server only).
 */

export type QuestionType =
  | "single_choice"
  | "image_choice"
  | "matching"
  | "ordering"
  | "pattern"
  | "memory";
export type Difficulty = "L1" | "L2" | "L3" | "L4";

/** What to draw. Replaces the brief's `imageUrl`: art is referenced by registry name. */
export type Visual =
  | { kind: "illustration"; name: IllustrationName }
  /** A letter or number tile (text, not emoji). */
  | { kind: "glyph"; text: string; tone?: BrandTone }
  /** `count` copies of an illustration, for counting questions. */
  | { kind: "group"; name: IllustrationName; count: number };

export interface QuestionOption {
  /** Opaque id — never encodes correctness. */
  id: string;
  /** Vietnamese accessible name / caption. */
  label: string;
  visual: Visual;
}

export interface MemoryCardData extends QuestionOption {
  /** Cards with the same pairKey match (memory games need this on the client by design). */
  pairKey: string;
}

interface QuestionBase {
  id: string;
  /** Short child-friendly instruction (also spoken). */
  prompt: string;
  /** Recorded instruction; when absent the UI uses a labelled demo voice. */
  instructionAudioUrl?: string;
  difficulty: Difficulty;
  /** The illustrated question, e.g. the ball in "which shape looks like the ball?". */
  stimulus?: Visual;
  /** Shown first, then hidden ("remember what you saw"). */
  memorize?: { visuals: Visual[]; seconds: number };
  /** Encouragement texts. Never contains the answer. */
  feedback?: { correctText?: string; incorrectText?: string; hint?: string };
  /** Tries before the answer is shown. Default 2. Not used by memory. */
  maxAttempts?: number;
}

export type LearningQuestion =
  | (QuestionBase & {
      type: "single_choice";
      options: QuestionOption[];
      config: { confirm: boolean };
    })
  | (QuestionBase & { type: "image_choice"; options: QuestionOption[] })
  | (QuestionBase & {
      type: "matching";
      config: { left: QuestionOption[]; right: QuestionOption[] };
    })
  | (QuestionBase & { type: "ordering"; config: { items: QuestionOption[] } })
  | (QuestionBase & {
      type: "pattern";
      /** null = blank to fill. */
      config: {
        sequence: Array<QuestionOption | null>;
        palette: QuestionOption[];
      };
    })
  | (QuestionBase & {
      type: "memory";
      config: {
        cards: MemoryCardData[];
        columns: 2 | 3 | 4;
        peekAfterMismatches?: number;
      };
    });

/** What the child answered. Sent to the grader. */
export type QuestionResponse =
  | { type: "single_choice" | "image_choice"; optionId: string }
  | { type: "matching"; pairs: Array<[string, string]> }
  | { type: "ordering"; order: string[] }
  | { type: "pattern"; fills: string[] }
  | { type: "memory"; moves: number };

/** The correct answer, returned only once a question is finished (last try or correct). */
export type Reveal =
  | { type: "choice"; optionId: string }
  | { type: "matching"; pairs: Array<[string, string]> }
  | { type: "ordering"; order: string[] }
  | { type: "pattern"; fills: string[] };

export interface GradeResult {
  correct: boolean;
  /** No more tries: move on. */
  final: boolean;
  reveal?: Reveal;
  /** Short spoken/caption feedback. */
  message: string;
}

export interface HintResult {
  text: string;
  /** For choice questions: one wrong option to fade out. */
  eliminateOptionId?: string;
}

// ── Catalog ─────────────────────────────────────────────────────────────

export interface LessonSummary {
  id: string;
  worldId: string;
  skillId: string;
  title: string;
  objective: string;
  minutes: number;
  cover: Visual;
  questionCount: number;
}

export interface Lesson extends LessonSummary {
  questions: LearningQuestion[];
}

export interface Skill {
  id: string;
  worldId: string;
  title: string;
  lessons: LessonSummary[];
}

export interface World {
  id: string;
  nameVi: string;
  nameEn: string;
  /** Subject label, e.g. "Toán học". */
  category: string;
  description: string;
  tone: BrandTone;
  illustration: IllustrationName;
  /** Progression rule (DECISIONS D-031). */
  unlock?: { minCompletedLessons: number };
  skills: Skill[];
}

/** Everything the student UI needs to navigate (no questions, no answers). */
export interface Catalog {
  worlds: World[];
}
