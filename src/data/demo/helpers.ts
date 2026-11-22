import type { BrandTone } from "@/design-system/tokens";
import type {
  LearningQuestion,
  QuestionOption,
  Visual,
} from "@/features/learning/types";
import type { IllustrationName } from "@/illustrations/registry";

/**
 * DEMO CONTENT — authored for Sprint 03 to exercise the student experience.
 * Not official curriculum, not entrance-exam material. Pending education
 * reviewer sign-off (DECISIONS P-4).
 */

export const ill = (name: IllustrationName): Visual => ({
  kind: "illustration",
  name,
});
export const glyph = (text: string, tone?: BrandTone): Visual => ({
  kind: "glyph",
  text,
  tone,
});
export const group = (name: IllustrationName, count: number): Visual => ({
  kind: "group",
  name,
  count,
});
export const opt = (
  id: string,
  label: string,
  visual: Visual,
): QuestionOption => ({ id, label, visual });

/** Common pictures with their Vietnamese names. */
export const P = {
  circle: ["Hình tròn", ill("shape.circle")],
  triangle: ["Hình tam giác", ill("shape.triangle")],
  square: ["Hình vuông", ill("shape.square")],
  star: ["Ngôi sao", ill("shape.star")],
  ball: ["Quả bóng", ill("object.ball")],
  apple: ["Quả táo", ill("food.apple")],
  banana: ["Quả chuối", ill("food.banana")],
  orange: ["Quả cam", ill("food.orange")],
  grapes: ["Chùm nho", ill("food.grapes")],
  cat: ["Con mèo", ill("animal.cat")],
  dog: ["Con chó", ill("animal.dog")],
  fish: ["Con cá", ill("animal.fish")],
  bird: ["Con chim", ill("animal.bird")],
  chicken: ["Con gà", ill("animal.chicken")],
  book: ["Quyển sách", ill("object.book")],
  pencil: ["Bút chì", ill("object.pencil")],
  backpack: ["Cặp sách", ill("object.backpack")],
  bed: ["Đi ngủ", ill("routine.bed")],
  toothbrush: ["Đánh răng", ill("routine.toothbrush")],
  soap: ["Rửa tay", ill("routine.soap")],
  bowl: ["Ăn cơm", ill("routine.bowl")],
  red: ["Màu đỏ", ill("color.red")],
  blue: ["Màu xanh dương", ill("color.blue")],
  yellow: ["Màu vàng", ill("color.yellow")],
  green: ["Màu xanh lá", ill("color.green")],
  orangeColor: ["Màu cam", ill("color.orange")],
  purple: ["Màu tím", ill("color.purple")],
} as const satisfies Record<string, readonly [string, Visual]>;

export type PictureKey = keyof typeof P;

/** Option from a common picture, optionally with a different label. */
export const pic = (
  id: string,
  key: PictureKey,
  label?: string,
): QuestionOption => opt(id, label ?? P[key][0], P[key][1]);
export const letter = (id: string, text: string): QuestionOption =>
  opt(id, `Chữ ${text}`, glyph(text, "lavender"));
export const num = (id: string, n: number): QuestionOption =>
  opt(id, `Số ${n}`, glyph(String(n), "blue"));

/** Memory cards: two of each picture, interleaved in a fixed, non-adjacent order. */
export function memoryCards(
  keys: PictureKey[],
  order: number[],
): Extract<LearningQuestion, { type: "memory" }>["config"]["cards"] {
  const deck = keys.flatMap((k, i) => [
    { id: `m${i * 2 + 1}`, pairKey: `k${i}`, label: P[k][0], visual: P[k][1] },
    { id: `m${i * 2 + 2}`, pairKey: `k${i}`, label: P[k][0], visual: P[k][1] },
  ]);
  return order.map((i) => deck[i]!);
}

/** Memory cards from letters. */
export function letterCards(
  letters: string[],
  order: number[],
): Extract<LearningQuestion, { type: "memory" }>["config"]["cards"] {
  const deck = letters.flatMap((t, i) => [
    {
      id: `m${i * 2 + 1}`,
      pairKey: `k${i}`,
      label: `Chữ ${t}`,
      visual: glyph(t, "lavender"),
    },
    {
      id: `m${i * 2 + 2}`,
      pairKey: `k${i}`,
      label: `Chữ ${t}`,
      visual: glyph(t, "lavender"),
    },
  ]);
  return order.map((i) => deck[i]!);
}

export interface LessonSource {
  id: string;
  title: string;
  objective: string;
  minutes: number;
  cover: Visual;
  questions: LearningQuestion[];
}

export interface WorldSource {
  /** Must match an id in design-system/worlds.ts. */
  id: string;
  category: string;
  description: string;
  unlock?: { minCompletedLessons: number };
  skills: Array<{ id: string; title: string; lessons: LessonSource[] }>;
}
