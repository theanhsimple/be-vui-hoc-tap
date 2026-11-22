import type { QuestionResult } from "../progress/model";
import type { GradeResult, LearningQuestion, Reveal } from "../types";

/**
 * Lesson player state machine.
 *
 *   memorize? → answering ⇄ grading → feedback → (next question | complete)
 *
 * - SUBMIT is ignored unless the player is "answering" (no double submits).
 * - NEXT is ignored unless a question is finished ("feedback" + final).
 * - A wrong, non-final answer returns to "answering" with a try-again message.
 */

export type FeedbackKind = "success" | "tryAgain" | "reveal";

export interface PlayerState {
  index: number;
  total: number;
  phase: "memorize" | "answering" | "grading" | "feedback" | "complete";
  /** 1-based attempt number for the current question. */
  attempt: number;
  feedback?: { kind: FeedbackKind; message: string };
  reveal?: Reveal;
  /** Options faded out by a hint. */
  eliminated: string[];
  hint?: string;
  hintUsed: boolean;
  error?: string;
  results: QuestionResult[];
}

export type PlayerAction =
  | { type: "MEMORIZE_DONE" }
  | { type: "SUBMIT" }
  | { type: "GRADED"; result: GradeResult }
  | { type: "GRADE_FAILED" }
  | { type: "HINT"; text: string; eliminateOptionId?: string }
  | { type: "NEXT" };

function enterQuestion(
  questions: readonly LearningQuestion[],
  index: number,
  results: QuestionResult[],
): PlayerState {
  const q = questions[index];
  return {
    index,
    total: questions.length,
    phase: !q ? "complete" : q.memorize ? "memorize" : "answering",
    attempt: 1,
    eliminated: [],
    hintUsed: false,
    results,
  };
}

export function initPlayer(
  questions: readonly LearningQuestion[],
  resume?: { index: number; results: QuestionResult[]; attempt?: number },
): PlayerState {
  const index = resume
    ? Math.min(Math.max(resume.index, 0), questions.length)
    : 0;
  const state = enterQuestion(
    questions,
    index,
    resume?.results.slice(0, index) ?? [],
  );
  const max = questions[index]?.maxAttempts ?? 2;
  return resume?.attempt
    ? { ...state, attempt: Math.min(Math.max(resume.attempt, 1), max) }
    : state;
}

export function createPlayerReducer(questions: readonly LearningQuestion[]) {
  return function reducer(
    state: PlayerState,
    action: PlayerAction,
  ): PlayerState {
    const question = questions[state.index];
    switch (action.type) {
      case "MEMORIZE_DONE":
        return state.phase === "memorize"
          ? { ...state, phase: "answering" }
          : state;

      case "SUBMIT":
        return state.phase === "answering"
          ? { ...state, phase: "grading", error: undefined }
          : state;

      case "GRADE_FAILED":
        return state.phase === "grading"
          ? {
              ...state,
              phase: "answering",
              error: "Mạng đang chậm. Con thử lại nhé.",
            }
          : state;

      case "GRADED": {
        if (state.phase !== "grading" || !question) return state;
        const { result } = action;
        if (!result.final) {
          return {
            ...state,
            phase: "answering",
            attempt: state.attempt + 1,
            feedback: { kind: "tryAgain", message: result.message },
          };
        }
        const record: QuestionResult = {
          questionId: question.id,
          correct: result.correct,
          firstTry: result.correct && state.attempt === 1,
          attempts: state.attempt,
        };
        return {
          ...state,
          phase: "feedback",
          feedback: {
            kind: result.correct ? "success" : "reveal",
            message: result.message,
          },
          reveal: result.reveal,
          results: [...state.results, record],
        };
      }

      case "HINT":
        if (state.phase !== "answering" && state.phase !== "grading")
          return state;
        return {
          ...state,
          hint: action.text,
          hintUsed: true,
          eliminated: action.eliminateOptionId
            ? [...new Set([...state.eliminated, action.eliminateOptionId])]
            : state.eliminated,
        };

      case "NEXT":
        if (state.phase !== "feedback") return state;
        return enterQuestion(questions, state.index + 1, state.results);
    }
  };
}
