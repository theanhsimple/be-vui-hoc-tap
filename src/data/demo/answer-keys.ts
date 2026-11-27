import type { AnswerKey } from "@/features/learning/grading/keys";

/**
 * DEMO ANSWER KEYS. Server edition: only the seed generator reads them (they
 * live in private.question_answer_keys; a test forbids other imports).
 * Device edition (static hosting, D-056): bundled to grade on the device.
 * The marker below lets QA confirm this module never reaches the browser.
 */
export const ANSWER_KEYS_MARKER = "little-demo-answer-keys-v1";

const choice = (optionId: string, hintEliminate?: string): AnswerKey => ({
  type: "choice",
  optionId,
  hintEliminate,
});
const order = (...ids: string[]): AnswerKey => ({
  type: "ordering",
  order: ids,
});
const fills = (...ids: string[]): AnswerKey => ({
  type: "pattern",
  fills: ids,
});
const pairs = (...p: Array<[string, string]>): AnswerKey => ({
  type: "matching",
  pairs: p,
});
const memory: AnswerKey = { type: "memory" };

export const DEMO_ANSWER_KEYS: Readonly<Record<string, AnswerKey>> = {
  // Alphabet Forest
  "af-l1-q1": choice("b", "a"),
  "af-l1-q2": choice("c", "a"),
  "af-l1-q3": pairs(["l1", "r2"], ["l2", "r3"], ["l3", "r1"]),
  "af-l2-q1": choice("b", "c"),
  "af-l2-q2": choice("a", "b"),
  "af-l2-q3": memory,
  "af-l3-q1": choice("b", "a"),
  "af-l3-q2": choice("c", "a"),
  "af-l3-q3": choice("a", "c"),
  "af-l4-q1": pairs(["l1", "r3"], ["l2", "r1"], ["l3", "r2"]),
  "af-l4-q2": choice("b", "c"),
  "af-l4-q3": choice("c", "a"),
  // Number Kingdom
  "nk-l1-q1": choice("b", "c"),
  "nk-l1-q2": choice("a", "c"),
  "nk-l1-q3": order("i2", "i3", "i1"),
  "nk-l2-q1": choice("c", "b"),
  "nk-l2-q2": choice("c", "a"),
  "nk-l2-q3": order("i2", "i4", "i3", "i1"),
  "nk-l3-q1": choice("c", "b"),
  "nk-l3-q2": choice("a", "c"),
  "nk-l3-q3": fills("p1"),
  "nk-l4-q1": choice("b"),
  "nk-l4-q2": pairs(["l1", "r3"], ["l2", "r1"], ["l3", "r2"]),
  "nk-l4-q3": choice("b", "a"),
  // IQ Castle
  "iq-l1-q1": fills("p2"),
  "iq-l1-q2": fills("p2"),
  "iq-l1-q3": fills("p3"),
  "iq-l2-q1": fills("p2"),
  "iq-l2-q2": fills("p2", "p1"),
  "iq-l2-q3": order("i2", "i3", "i1"),
  "iq-l3-q1": choice("b", "a"),
  "iq-l3-q2": choice("b", "a"),
  "iq-l3-q3": choice("b", "c"),
  "iq-l4-q1": pairs(["l1", "r3"], ["l2", "r1"], ["l3", "r2"]),
  "iq-l4-q2": choice("c", "a"),
  "iq-l4-q3": choice("b", "c"),
  // Memory Garden
  "mg-l1-q1": memory,
  "mg-l1-q2": memory,
  "mg-l1-q3": memory,
  "mg-l2-q1": memory,
  "mg-l2-q2": memory,
  "mg-l2-q3": memory,
  "mg-l3-q1": choice("b", "c"),
  "mg-l3-q2": choice("c", "a"),
  "mg-l3-q3": choice("b", "a"),
  "mg-l4-q1": order("i2", "i3", "i1"),
  "mg-l4-q2": order("i2", "i3", "i1"),
  "mg-l4-q3": order("i3", "i4", "i1", "i2"),
  // English Island
  "ei-l1-q1": choice("b", "c"),
  "ei-l1-q2": choice("c", "a"),
  "ei-l1-q3": choice("a", "c"),
  "ei-l2-q1": choice("b", "a"),
  "ei-l2-q2": choice("a", "c"),
  "ei-l2-q3": choice("c", "b"),
  "ei-l3-q1": choice("b", "c"),
  "ei-l3-q2": choice("a", "b"),
  "ei-l3-q3": choice("c", "a"),
  "ei-l4-q1": choice("b", "c"),
  "ei-l4-q2": choice("c", "b"),
  "ei-l4-q3": choice("a", "c"),
  // School Town
  "st-l1-q1": choice("b", "c"),
  "st-l1-q2": choice("a", "c"),
  "st-l1-q3": choice("c", "a"),
  "st-l2-q1": choice("b", "c"),
  "st-l2-q2": choice("b", "a"),
  "st-l2-q3": memory,
  "st-l3-q1": choice("b", "a"),
  "st-l3-q2": choice("a", "c"),
  "st-l3-q3": order("i2", "i3", "i1"),
  "st-l4-q1": order("i3", "i1", "i2"),
  "st-l4-q2": order("i3", "i1", "i2"),
  "st-l4-q3": choice("c", "a"),
  // Challenge Arena
  "ca-l1-q1": choice("b", "c"),
  "ca-l1-q2": choice("b", "a"),
  "ca-l1-q3": fills("p2"),
  "ca-l2-q1": memory,
  "ca-l2-q2": order("i3", "i2", "i4", "i1"),
  "ca-l2-q3": choice("c", "a"),
  "ca-l3-q1": pairs(["l1", "r2"], ["l2", "r3"], ["l3", "r1"]),
  "ca-l3-q2": choice("b", "c"),
  "ca-l3-q3": choice("c", "a"),
  "ca-l4-q1": order("i2", "i3", "i1"),
  "ca-l4-q2": fills("p2", "p1"),
  "ca-l4-q3": choice("c", "b"),
};

export function getDemoAnswerKey(questionId: string): AnswerKey | undefined {
  return DEMO_ANSWER_KEYS[questionId];
}
