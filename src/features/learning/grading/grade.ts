import type {
  GradeResult,
  LearningQuestion,
  QuestionResponse,
  Reveal,
} from "../types";
import type { AnswerKey } from "./keys";

export const DEFAULT_MAX_ATTEMPTS = 2;

const CORRECT_MESSAGES = [
  "Đúng rồi! Con nhìn rất kỹ!",
  "Chính xác! Con cố gắng tuyệt lắm!",
  "Đúng rồi! Mình cùng đi tiếp nhé!",
];
const TRY_AGAIN = "Gần đúng rồi! Con thử lại nhé.";
const REVEAL = "Cùng xem đáp án nhé. Lần sau con sẽ làm được!";

const samePairs = (a: Array<[string, string]>, b: Array<[string, string]>) => {
  if (a.length !== b.length) return false;
  const set = new Set(b.map(([l, r]) => `${l}→${r}`));
  return a.every(([l, r]) => set.has(`${l}→${r}`));
};
const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

function isCorrect(key: AnswerKey, response: QuestionResponse): boolean {
  switch (key.type) {
    case "choice":
      return (
        (response.type === "single_choice" ||
          response.type === "image_choice") &&
        response.optionId === key.optionId
      );
    case "matching":
      return (
        response.type === "matching" && samePairs(response.pairs, key.pairs)
      );
    case "ordering":
      return (
        response.type === "ordering" && sameList(response.order, key.order)
      );
    case "pattern":
      return response.type === "pattern" && sameList(response.fills, key.fills);
    case "memory":
      // Completing the memory game is the goal; mismatches are part of playing.
      return response.type === "memory";
  }
}

function toReveal(key: AnswerKey): Reveal | undefined {
  switch (key.type) {
    case "choice":
      return { type: "choice", optionId: key.optionId };
    case "matching":
      return { type: "matching", pairs: key.pairs };
    case "ordering":
      return { type: "ordering", order: key.order };
    case "pattern":
      return { type: "pattern", fills: key.fills };
    case "memory":
      return undefined;
  }
}

/**
 * Grades one attempt. Pure: the caller loads the key (server side).
 * The correct answer is only included once the question is finished
 * (correct, or the last allowed try).
 */
export function gradeResponse(
  question: LearningQuestion,
  key: AnswerKey,
  response: QuestionResponse,
  attempt: number,
): GradeResult {
  const correct = isCorrect(key, response);
  const max = question.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const final = correct || attempt >= max;
  if (correct) {
    const message =
      question.feedback?.correctText ??
      CORRECT_MESSAGES[attempt % CORRECT_MESSAGES.length]!;
    return { correct, final, message };
  }
  return {
    correct,
    final,
    reveal: final ? toReveal(key) : undefined,
    message: final ? REVEAL : (question.feedback?.incorrectText ?? TRY_AGAIN),
  };
}

/** Which response type each question type expects. */
export function responseMatchesQuestion(
  question: LearningQuestion,
  response: QuestionResponse,
): boolean {
  if (question.type !== response.type) return false;
  const ids = (list: Array<{ id: string }>) => new Set(list.map((o) => o.id));
  switch (response.type) {
    case "single_choice":
    case "image_choice":
      return (
        "options" in question && ids(question.options).has(response.optionId)
      );
    case "matching": {
      if (question.type !== "matching") return false;
      const l = ids(question.config.left);
      const r = ids(question.config.right);
      return response.pairs.every(([a, b]) => l.has(a) && r.has(b));
    }
    case "ordering":
      return (
        question.type === "ordering" &&
        response.order.every((id) => ids(question.config.items).has(id))
      );
    case "pattern":
      return (
        question.type === "pattern" &&
        response.fills.every((id) => ids(question.config.palette).has(id))
      );
    case "memory":
      return question.type === "memory";
  }
}
