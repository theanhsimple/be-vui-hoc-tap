import type { AnswerKey } from "@/features/learning/grading/keys";
import type {
  LearningQuestion,
  QuestionOption,
  Visual,
} from "@/features/learning/types";

import {
  glyph,
  group,
  type LessonSource,
  letter,
  letterCards,
  memoryCards,
  num,
  opt,
  P,
  type PictureKey,
  pic,
} from "./helpers";

/**
 * CONTENT EXPANSION (release 2): two more lessons per skill, 5 questions
 * each (4 for memory boards). DRAFT content pending education review (P-4),
 * same rules as Sprint 03: no grades, no admission material.
 *
 * Questions are built from small specs and the answer key is DERIVED from the
 * same spec, so content and key cannot drift. content.test.ts re-checks the
 * meaning of every question independently.
 */

type Level = LearningQuestion["difficulty"];
interface Built {
  q: LearningQuestion;
  key: AnswerKey;
}
const ABC = ["a", "b", "c", "d"];

const choiceKey = (options: QuestionOption[], index: number): AnswerKey => ({
  type: "choice",
  optionId: options[index]!.id,
});

// ── Builders ────────────────────────────────────────────────────────────

const illustrationOf = (k: PictureKey) =>
  (P[k][1] as Extract<Visual, { kind: "illustration" }>).name;

/** "Có bao nhiêu <noun>?" — answer = the shown count. */
function count(
  id: string,
  l: Level,
  item: PictureKey,
  noun: string,
  n: number,
  choices: number[],
): Built {
  const options = choices.map((c, i) => num(ABC[i]!, c));
  return {
    q: {
      id,
      type: "single_choice",
      difficulty: l,
      prompt: `Có bao nhiêu ${noun}?`,
      stimulus: group(illustrationOf(item), n),
      options,
      config: { confirm: n > 5 },
      feedback: { hint: "Chạm vào từng cái và đếm thật chậm nhé." },
    },
    key: choiceKey(options, choices.indexOf(n)),
  };
}

/** "Đâu là chữ X?" */
function findLetter(
  id: string,
  l: Level,
  target: string,
  choices: string[],
): Built {
  const options = choices.map((c, i) => letter(ABC[i]!, c));
  return {
    q: {
      id,
      type: "image_choice",
      difficulty: l,
      prompt: `Đâu là chữ ${target}?`,
      options,
    },
    key: choiceKey(options, choices.indexOf(target)),
  };
}

/** "Số nào đứng ngay sau/trước số N?" */
function neighbour(
  id: string,
  l: Level,
  n: number,
  dir: "sau" | "trước",
  choices: number[],
): Built {
  const want = dir === "sau" ? n + 1 : n - 1;
  const options = choices.map((c, i) => num(ABC[i]!, c));
  return {
    q: {
      id,
      type: "single_choice",
      difficulty: l,
      prompt: `Số nào đứng ngay ${dir} số ${n}?`,
      stimulus: glyph(String(n), "blue"),
      options,
      config: { confirm: true },
      feedback: {
        hint: dir === "sau" ? `Đếm tiếp từ ${n} nhé.` : `Đếm lùi từ ${n} nhé.`,
      },
    },
    key: choiceKey(options, choices.indexOf(want)),
  };
}

/** "Số nào lớn/bé nhất?" */
function extreme(
  id: string,
  l: Level,
  which: "lớn" | "bé",
  nums: number[],
): Built {
  const options = nums.map((c, i) => num(ABC[i]!, c));
  const want = which === "lớn" ? Math.max(...nums) : Math.min(...nums);
  return {
    q: {
      id,
      type: "single_choice",
      difficulty: l,
      prompt: `Số nào ${which} nhất?`,
      options,
      config: { confirm: true },
    },
    key: choiceKey(options, nums.indexOf(want)),
  };
}

const groupOpt = (
  id: string,
  item: PictureKey,
  noun: string,
  n: number,
): QuestionOption => opt(id, `${n} ${noun}`, group(illustrationOf(item), n));

/** "Nhóm nào có N <noun>?" */
function groupOf(
  id: string,
  l: Level,
  item: PictureKey,
  noun: string,
  n: number,
  counts: number[],
): Built {
  const options = counts.map((c, i) => groupOpt(ABC[i]!, item, noun, c));
  return {
    q: {
      id,
      type: "image_choice",
      difficulty: l,
      prompt: `Nhóm nào có ${n} ${noun}?`,
      options,
      feedback: { hint: "Đếm từng nhóm nhé." },
    },
    key: choiceKey(options, counts.indexOf(n)),
  };
}

/** "Nhóm nào có nhiều/ít <noun> hơn?" */
function moreLess(
  id: string,
  l: Level,
  which: "nhiều" | "ít",
  item: PictureKey,
  noun: string,
  counts: number[],
): Built {
  const options = counts.map((c, i) => groupOpt(ABC[i]!, item, noun, c));
  const want = which === "nhiều" ? Math.max(...counts) : Math.min(...counts);
  return {
    q: {
      id,
      type: "image_choice",
      difficulty: l,
      prompt: `Nhóm nào có ${which} ${noun} hơn?`,
      options,
    },
    key: choiceKey(options, counts.indexOf(want)),
  };
}

const ascendingIds = (
  items: QuestionOption[],
  value: (o: QuestionOption) => number,
) => [...items].sort((a, b) => value(a) - value(b)).map((o) => o.id);

function orderNumbers(id: string, l: Level, nums: number[]): Built {
  const items = nums.map((n, i) => num(`i${i + 1}`, n));
  return {
    q: {
      id,
      type: "ordering",
      difficulty: l,
      prompt: "Xếp các số từ bé đến lớn.",
      config: { items },
      feedback: { hint: "Số nào đếm trước tiên?" },
    },
    key: {
      type: "ordering",
      order: ascendingIds(items, (o) =>
        Number((o.visual as { text: string }).text),
      ),
    },
  };
}

function orderGroups(
  id: string,
  l: Level,
  item: PictureKey,
  noun: string,
  counts: number[],
): Built {
  const items = counts.map((n, i) => groupOpt(`i${i + 1}`, item, noun, n));
  return {
    q: {
      id,
      type: "ordering",
      difficulty: l,
      prompt: "Xếp từ ít đến nhiều.",
      config: { items },
    },
    key: {
      type: "ordering",
      order: ascendingIds(items, (o) => (o.visual as { count: number }).count),
    },
  };
}

/** Upper-case ↔ lower-case. `rightOrder` shuffles the right column. */
function matchCase(
  id: string,
  l: Level,
  letters: string[],
  rightOrder: number[],
): Built {
  const left = letters.map((t, i) => letter(`l${i + 1}`, t));
  const right = rightOrder.map((i, j) =>
    opt(
      `r${j + 1}`,
      `Chữ ${letters[i]!.toLowerCase()}`,
      glyph(letters[i]!.toLowerCase(), "mint"),
    ),
  );
  return {
    q: {
      id,
      type: "matching",
      difficulty: l,
      prompt: "Nối chữ in hoa với chữ thường giống nó.",
      config: { left, right },
    },
    key: {
      type: "matching",
      pairs: left.map(
        (o, i) => [o.id, right[rightOrder.indexOf(i)]!.id] as [string, string],
      ),
    },
  };
}

/** Group ↔ number. */
function matchCount(
  id: string,
  l: Level,
  item: PictureKey,
  noun: string,
  counts: number[],
  rightOrder: number[],
): Built {
  const left = counts.map((n, i) => groupOpt(`l${i + 1}`, item, noun, n));
  const right = rightOrder.map((i, j) => num(`r${j + 1}`, counts[i]!));
  return {
    q: {
      id,
      type: "matching",
      difficulty: l,
      prompt: "Nối mỗi nhóm với số đúng.",
      config: { left, right },
      feedback: { hint: "Đếm từng nhóm trước nhé." },
    },
    key: {
      type: "matching",
      pairs: left.map(
        (o, i) => [o.id, right[rightOrder.indexOf(i)]!.id] as [string, string],
      ),
    },
  };
}

/** Pairs of pictures (e.g. colour ↔ fruit, letter ↔ picture). */
function matchPairs(
  id: string,
  l: Level,
  prompt: string,
  pairs: Array<[QuestionOption, QuestionOption]>,
  rightOrder: number[],
): Built {
  const left = pairs.map(([a], i) => ({ ...a, id: `l${i + 1}` }));
  const right = rightOrder.map((i, j) => ({
    ...pairs[i]![1],
    id: `r${j + 1}`,
  }));
  return {
    q: { id, type: "matching", difficulty: l, prompt, config: { left, right } },
    key: {
      type: "matching",
      pairs: left.map(
        (o, i) => [o.id, right[rightOrder.indexOf(i)]!.id] as [string, string],
      ),
    },
  };
}

/** Repeating pattern; blanks at the end. */
function pattern(
  id: string,
  l: Level,
  prompt: string,
  unit: PictureKey[],
  shown: number,
  blanks: number,
  palette: PictureKey[],
): Built {
  const seq = Array.from(
    { length: shown + blanks },
    (_, i) => unit[i % unit.length]!,
  );
  const pal = palette.map((k, i) => pic(`p${i + 1}`, k));
  return {
    q: {
      id,
      type: "pattern",
      difficulty: l,
      prompt,
      config: {
        sequence: seq.map((k, i) => (i < shown ? pic(`s${i + 1}`, k) : null)),
        palette: pal,
      },
      feedback: { hint: "Nói to quy luật rồi đoán tiếp nhé." },
    },
    key: {
      type: "pattern",
      fills: seq.slice(shown).map((k) => pal[palette.indexOf(k)]!.id),
    },
  };
}

/** Generic picture choice; `answer` is the index of the right option. */
function choose(
  id: string,
  l: Level,
  prompt: string,
  options: Array<PictureKey | [PictureKey, string]>,
  answer: number,
  hint?: string,
  stimulus?: Visual,
): Built {
  const opts = options.map((o, i) =>
    Array.isArray(o) ? pic(ABC[i]!, o[0], o[1]) : pic(ABC[i]!, o),
  );
  return {
    q: {
      id,
      type: "image_choice",
      difficulty: l,
      prompt,
      options: opts,
      ...(stimulus ? { stimulus } : {}),
      ...(hint ? { feedback: { hint } } : {}),
    },
    key: choiceKey(opts, answer),
  };
}

/** "Tiếng nào bắt đầu bằng chữ X?" with one-word labels. */
function initial(
  id: string,
  l: Level,
  target: string,
  options: Array<[PictureKey, string]>,
  hint: string,
): Built {
  const answer = options.findIndex(
    ([, w]) =>
      w.toLowerCase().startsWith(target.toLowerCase()) &&
      !(target === "C" && w.startsWith("ch")),
  );
  return choose(
    id,
    l,
    `Tiếng nào bắt đầu bằng chữ ${target}?`,
    options,
    answer,
    hint,
    glyph(target, "lavender"),
  );
}

/** 'Tiếng “w” bắt đầu bằng chữ nào?' */
function initialOf(
  id: string,
  l: Level,
  word: string,
  picture: PictureKey,
  letters: string[],
): Built {
  const options = letters.map((t, i) => letter(ABC[i]!, t));
  const first = word[0]!.toUpperCase();
  return {
    q: {
      id,
      type: "single_choice",
      difficulty: l,
      prompt: `Tiếng “${word}” bắt đầu bằng chữ nào?`,
      stimulus: P[picture][1],
      options,
      config: { confirm: true },
      feedback: { hint: `${word}… nghe âm đầu tiên nhé.` },
    },
    key: choiceKey(options, letters.indexOf(first)),
  };
}

/** English "Find …!" (same format as English Island). */
function findEn(
  id: string,
  word: string,
  vi: string,
  keys: PictureKey[],
  answer: number,
): Built {
  const options = keys.map((k, i) => pic(ABC[i]!, k));
  return {
    q: {
      id,
      type: "image_choice",
      difficulty: "L1",
      prompt: `Find ${word}! Con hãy tìm “${word}”.`,
      options,
      feedback: {
        correctText: `Yes! ${word} — ${vi}.`,
        hint: `“${word}” là ${vi}.`,
      },
    },
    key: choiceKey(options, answer),
  };
}

function memory(
  id: string,
  l: Level,
  prompt: string,
  keys: PictureKey[],
  order: number[],
  columns: 2 | 3 | 4,
): Built {
  return {
    q: {
      id,
      type: "memory",
      difficulty: l,
      prompt,
      config: {
        cards: memoryCards(keys, order),
        columns,
        peekAfterMismatches: keys.length + 1,
      },
    },
    key: { type: "memory" },
  };
}
function memoryLetters(
  id: string,
  l: Level,
  letters: string[],
  order: number[],
  columns: 2 | 3 | 4,
): Built {
  return {
    q: {
      id,
      type: "memory",
      difficulty: l,
      prompt: "Tìm hai chữ giống nhau.",
      config: {
        cards: letterCards(letters, order),
        columns,
        peekAfterMismatches: letters.length + 1,
      },
    },
    key: { type: "memory" },
  };
}

/** "Con vừa thấy hình nào?" — exactly one option was shown. */
function seen(
  id: string,
  l: Level,
  shown: PictureKey[],
  options: PictureKey[],
  seconds = 3,
): Built {
  const b = choose(
    id,
    l,
    "Con vừa thấy hình nào?",
    options,
    options.findIndex((k) => shown.includes(k)),
  );
  return {
    ...b,
    q: { ...b.q, memorize: { visuals: shown.map((k) => P[k][1]), seconds } },
  };
}

/** "Xếp lại đúng thứ tự con vừa thấy." `itemsOrder` = how the items are offered. */
function recall(
  id: string,
  l: Level,
  shown: PictureKey[],
  itemsOrder: number[],
  seconds = 4,
): Built {
  const items = itemsOrder.map((i, j) => pic(`i${j + 1}`, shown[i]!));
  return {
    q: {
      id,
      type: "ordering",
      difficulty: l,
      prompt: "Xếp lại đúng thứ tự con vừa thấy.",
      memorize: { visuals: shown.map((k) => P[k][1]), seconds },
      config: { items },
    },
    key: {
      type: "ordering",
      order: shown.map((_, i) => items[itemsOrder.indexOf(i)]!.id),
    },
  };
}

/** "Xếp theo lời cô: a, b, c." */
function follow(
  id: string,
  l: Level,
  spoken: PictureKey[],
  itemsOrder: number[],
): Built {
  const items = itemsOrder.map((i, j) => pic(`i${j + 1}`, spoken[i]!));
  return {
    q: {
      id,
      type: "ordering",
      difficulty: l,
      prompt: `Xếp theo lời cô: ${spoken.map((k) => P[k][0].toLowerCase()).join(", ")}.`,
      config: { items },
    },
    key: {
      type: "ordering",
      order: spoken.map((_, i) => items[itemsOrder.indexOf(i)]!.id),
    },
  };
}

/** Ordered routine with custom labels (first → last). */
function routine(
  id: string,
  l: Level,
  prompt: string,
  steps: Array<[PictureKey, string]>,
  itemsOrder: number[],
  hint: string,
): Built {
  const items = itemsOrder.map((i, j) =>
    pic(`i${j + 1}`, steps[i]![0], steps[i]![1]),
  );
  return {
    q: {
      id,
      type: "ordering",
      difficulty: l,
      prompt,
      config: { items },
      feedback: { hint },
    },
    key: {
      type: "ordering",
      order: steps.map((_, i) => items[itemsOrder.indexOf(i)]!.id),
    },
  };
}

// ── Lessons ─────────────────────────────────────────────────────────────

interface LessonSpec {
  id: string;
  title: string;
  objective: string;
  cover: Visual;
  build: (q: (n: number) => string) => Built[];
}

const KEYS: Record<string, AnswerKey> = {};
function lesson(spec: LessonSpec): LessonSource {
  const built = spec.build((n) => `${spec.id}-q${n}`);
  for (const b of built) KEYS[b.q.id] = b.key;
  return {
    id: spec.id,
    title: spec.title,
    objective: spec.objective,
    minutes: 6,
    cover: spec.cover,
    questions: built.map((b) => b.q),
  };
}

/** New lessons per skill id, appended after the existing lessons. */
export const EXPANSION: Record<string, LessonSource[]> = {
  // ── Rừng Chữ Cái ──
  "af-s1": [
    lesson({
      id: "af-l5",
      title: "Chữ D, Đ, E",
      objective: "Con sẽ nhận ra chữ D, Đ và E.",
      cover: glyph("Đ", "lavender"),
      build: (q) => [
        findLetter(q(1), "L1", "D", ["O", "D", "B"]),
        findLetter(q(2), "L2", "Đ", ["D", "B", "Đ"]),
        findLetter(q(3), "L1", "E", ["E", "B", "O"]),
        matchCase(q(4), "L2", ["D", "Đ", "E"], [2, 0, 1]),
        memoryLetters(q(5), "L2", ["D", "Đ", "E"], [0, 2, 4, 1, 5, 3], 3),
      ],
    }),
    lesson({
      id: "af-l6",
      title: "Chữ có mũ, có râu",
      objective: "Con sẽ nhận ra Ă, Â, Ô, Ơ, Ư.",
      cover: glyph("Ơ", "lavender"),
      build: (q) => [
        findLetter(q(1), "L2", "Ă", ["A", "Â", "Ă"]),
        findLetter(q(2), "L2", "Â", ["Â", "Ă", "A"]),
        findLetter(q(3), "L2", "Ô", ["O", "Ô", "Ơ"]),
        findLetter(q(4), "L2", "Ư", ["U", "Ơ", "Ư"]),
        matchCase(q(5), "L3", ["Ô", "Ơ", "Ư"], [1, 2, 0]),
      ],
    }),
  ],
  "af-s2": [
    lesson({
      id: "af-l7",
      title: "Âm đầu B, S, N",
      objective: "Con sẽ nghe âm đầu và tìm tiếng đúng.",
      cover: P.ball[1],
      build: (q) => [
        initial(
          q(1),
          "L2",
          "B",
          [
            ["ball", "bóng"],
            ["cat", "mèo"],
            ["fish", "cá"],
          ],
          "Nghe kỹ nhé: bờ… bóng.",
        ),
        initial(
          q(2),
          "L2",
          "S",
          [
            ["chicken", "gà"],
            ["book", "sách"],
            ["grapes", "nho"],
          ],
          "Nghe kỹ nhé: sờ… sách.",
        ),
        initial(
          q(3),
          "L2",
          "N",
          [
            ["apple", "táo"],
            ["dog", "chó"],
            ["grapes", "nho"],
          ],
          "Nghe kỹ nhé: nờ… nho.",
        ),
        initial(
          q(4),
          "L2",
          "T",
          [
            ["apple", "táo"],
            ["ball", "bóng"],
            ["chicken", "gà"],
          ],
          "Nghe kỹ nhé: tờ… táo.",
        ),
        matchPairs(
          q(5),
          "L3",
          "Nối chữ với hình có âm đầu giống nhau.",
          [
            [letter("x", "B"), pic("y", "ball", "bóng")],
            [letter("x", "S"), pic("y", "book", "sách")],
            [letter("x", "G"), pic("y", "chicken", "gà")],
          ],
          [2, 0, 1],
        ),
      ],
    }),
    lesson({
      id: "af-l8",
      title: "Tiếng này bắt đầu bằng chữ gì?",
      objective: "Con sẽ tìm chữ cái đứng đầu một tiếng.",
      cover: P.cat[1],
      build: (q) => [
        initialOf(q(1), "L3", "mèo", "cat", ["M", "N", "B"]),
        initialOf(q(2), "L3", "bóng", "ball", ["D", "B", "G"]),
        initialOf(q(3), "L3", "gà", "chicken", ["C", "T", "G"]),
        initialOf(q(4), "L3", "táo", "apple", ["T", "Đ", "N"]),
        initial(
          q(5),
          "L2",
          "Đ",
          [
            ["yellow", "vàng"],
            ["red", "đỏ"],
            ["purple", "tím"],
          ],
          "Nghe kỹ nhé: đờ… đỏ.",
        ),
      ],
    }),
  ],

  // ── Vương Quốc Số ──
  "nk-s1": [
    lesson({
      id: "nk-l5",
      title: "Số liền sau",
      objective: "Con sẽ đếm đến 10 và tìm số đứng ngay sau.",
      cover: group("food.grapes", 3),
      build: (q) => [
        count(q(1), "L2", "grapes", "chùm nho", 6, [6, 7, 5]),
        count(q(2), "L2", "fish", "con cá", 8, [7, 9, 8]),
        neighbour(q(3), "L2", 4, "sau", [3, 5, 6]),
        neighbour(q(4), "L2", 7, "sau", [8, 6, 9]),
        orderNumbers(q(5), "L2", [9, 6, 8, 7]),
      ],
    }),
    lesson({
      id: "nk-l6",
      title: "Số liền trước",
      objective: "Con sẽ đếm lùi và tìm số đứng ngay trước.",
      cover: group("food.orange", 4),
      build: (q) => [
        count(q(1), "L2", "orange", "quả cam", 9, [10, 8, 9]),
        groupOf(q(2), "L2", "star", "ngôi sao", 6, [5, 6, 7]),
        neighbour(q(3), "L2", 5, "trước", [4, 6, 3]),
        neighbour(q(4), "L3", 10, "trước", [8, 10, 9]),
        matchCount(q(5), "L2", "ball", "quả bóng", [4, 6, 5], [1, 2, 0]),
      ],
    }),
  ],
  "nk-s2": [
    lesson({
      id: "nk-l7",
      title: "Hình vuông và ngôi sao",
      objective: "Con sẽ nhận ra và đếm các hình.",
      cover: P.square[1],
      build: (q) => [
        choose(
          q(1),
          "L1",
          "Đâu là hình vuông?",
          ["circle", "square", "triangle"],
          1,
          "Hình vuông có bốn cạnh bằng nhau.",
        ),
        count(q(2), "L1", "circle", "hình tròn", 4, [3, 5, 4]),
        choose(
          q(3),
          "L1",
          "Hình nào khác các hình còn lại?",
          ["star", "star", "triangle"],
          2,
        ),
        pattern(
          q(4),
          "L2",
          "Chọn hình tiếp theo.",
          ["triangle", "star"],
          4,
          1,
          ["star", "circle", "triangle"],
        ),
        count(q(5), "L2", "star", "ngôi sao", 7, [7, 6, 8]),
      ],
    }),
    lesson({
      id: "nk-l8",
      title: "So sánh nhiều – ít",
      objective: "Con sẽ so sánh các nhóm và các số.",
      cover: group("food.banana", 3),
      build: (q) => [
        moreLess(q(1), "L1", "ít", "banana", "quả chuối", [6, 3]),
        moreLess(q(2), "L1", "nhiều", "cat", "con mèo", [2, 4]),
        extreme(q(3), "L2", "bé", [7, 3, 5]),
        extreme(q(4), "L2", "lớn", [6, 8, 10]),
        orderGroups(q(5), "L2", "apple", "quả táo", [5, 2, 4]),
      ],
    }),
  ],

  // ── Lâu Đài Tư Duy ──
  "iq-s1": [
    lesson({
      id: "iq-l5",
      title: "Quy luật ba bước",
      objective: "Con sẽ tìm quy luật lặp lại ba hình.",
      cover: P.purple[1],
      build: (q) => [
        pattern(
          q(1),
          "L2",
          "Chọn màu tiếp theo.",
          ["red", "yellow", "blue"],
          5,
          1,
          ["blue", "red", "green"],
        ),
        pattern(
          q(2),
          "L2",
          "Chọn hình tiếp theo.",
          ["circle", "square", "triangle"],
          5,
          1,
          ["square", "triangle", "star"],
        ),
        pattern(
          q(3),
          "L2",
          "Chọn quả tiếp theo.",
          ["apple", "apple", "banana"],
          5,
          1,
          ["banana", "apple", "grapes"],
        ),
        pattern(q(4), "L1", "Chọn màu tiếp theo.", ["green", "purple"], 5, 1, [
          "green",
          "purple",
          "orangeColor",
        ]),
        pattern(
          q(5),
          "L3",
          "Chọn con vật tiếp theo.",
          ["cat", "dog", "dog"],
          6,
          1,
          ["dog", "fish", "cat"],
        ),
      ],
    }),
    lesson({
      id: "iq-l6",
      title: "Điền hai chỗ trống",
      objective: "Con sẽ hoàn thành dãy còn thiếu hai hình.",
      cover: P.star[1],
      build: (q) => [
        pattern(
          q(1),
          "L2",
          "Chọn hai hình còn thiếu.",
          ["star", "circle"],
          4,
          2,
          ["circle", "star", "square"],
        ),
        pattern(
          q(2),
          "L3",
          "Chọn hai màu còn thiếu.",
          ["red", "blue", "yellow"],
          4,
          2,
          ["yellow", "red", "blue"],
        ),
        pattern(
          q(3),
          "L2",
          "Chọn hai quả còn thiếu.",
          ["orange", "grapes"],
          4,
          2,
          ["grapes", "banana", "orange"],
        ),
        pattern(
          q(4),
          "L3",
          "Chọn hai hình còn thiếu.",
          ["square", "square", "triangle"],
          4,
          2,
          ["triangle", "circle", "square"],
        ),
        orderGroups(q(5), "L2", "star", "ngôi sao", [3, 1, 2]),
      ],
    }),
  ],
  "iq-s2": [
    lesson({
      id: "iq-l7",
      title: "Cái nào không cùng nhóm?",
      objective: "Con sẽ tìm thứ không cùng nhóm với các thứ khác.",
      cover: P.banana[1],
      build: (q) => [
        choose(
          q(1),
          "L1",
          "Cái nào không phải là quả?",
          ["apple", "grapes", "cat"],
          2,
          "Hai thứ ăn được, một con vật.",
        ),
        choose(
          q(2),
          "L1",
          "Cái nào không phải là con vật?",
          ["banana", "dog", "bird"],
          0,
        ),
        choose(
          q(3),
          "L2",
          "Cái nào không phải là hình?",
          ["circle", "apple", "square"],
          1,
        ),
        choose(
          q(4),
          "L2",
          "Cái nào không phải là con vật?",
          ["fish", "chicken", "book"],
          2,
        ),
        choose(
          q(5),
          "L1",
          "Hình nào khác các hình còn lại?",
          ["square", "circle", "circle"],
          0,
        ),
      ],
    }),
    lesson({
      id: "iq-l8",
      title: "Xếp vào đúng nhóm",
      objective: "Con sẽ nhận ra con vật, quả và đồ dùng học tập.",
      cover: P.dog[1],
      build: (q) => [
        choose(q(1), "L1", "Đâu là con vật?", ["book", "orange", "fish"], 2),
        choose(q(2), "L1", "Đâu là quả?", ["banana", "pencil", "dog"], 0),
        choose(
          q(3),
          "L1",
          "Đâu là đồ dùng học tập?",
          ["cat", "pencil", "apple"],
          1,
        ),
        matchPairs(
          q(4),
          "L2",
          "Nối màu với quả có màu đó.",
          [
            [pic("x", "red"), pic("y", "apple")],
            [pic("x", "yellow"), pic("y", "banana")],
            [pic("x", "purple"), pic("y", "grapes")],
          ],
          [1, 2, 0],
        ),
        choose(
          q(5),
          "L2",
          "Cái nào không phải đồ dùng học tập?",
          ["book", "fish", "backpack"],
          1,
        ),
      ],
    }),
  ],

  // ── Khu Vườn Trí Nhớ ──
  "mg-s1": [
    lesson({
      id: "mg-l5",
      title: "Ghép cặp con vật và quả",
      objective: "Con sẽ nhớ vị trí để tìm các cặp giống nhau.",
      cover: P.bird[1],
      build: (q) => [
        memory(
          q(1),
          "L1",
          "Tìm hai con vật giống nhau.",
          ["bird", "chicken", "dog"],
          [0, 2, 4, 1, 5, 3],
          3,
        ),
        memory(
          q(2),
          "L2",
          "Tìm hai quả giống nhau.",
          ["apple", "grapes", "orange", "banana"],
          [0, 2, 4, 6, 3, 1, 7, 5],
          4,
        ),
        memory(
          q(3),
          "L2",
          "Tìm hai màu giống nhau.",
          ["red", "green", "purple"],
          [2, 0, 4, 1, 5, 3],
          3,
        ),
        memoryLetters(
          q(4),
          "L2",
          ["A", "B", "C", "D"],
          [0, 2, 4, 6, 1, 3, 7, 5],
          4,
        ),
      ],
    }),
    lesson({
      id: "mg-l6",
      title: "Ghép cặp thật nhiều",
      objective: "Con sẽ tìm sáu cặp thẻ giống nhau.",
      cover: P.fish[1],
      build: (q) => [
        memory(
          q(1),
          "L2",
          "Tìm hai con vật giống nhau.",
          ["cat", "dog", "fish", "bird"],
          [6, 0, 2, 4, 1, 7, 3, 5],
          4,
        ),
        memory(
          q(2),
          "L3",
          "Tìm hai hình giống nhau.",
          ["circle", "triangle", "square", "star", "ball", "apple"],
          [0, 2, 4, 6, 8, 10, 1, 3, 11, 5, 7, 9],
          4,
        ),
        memory(
          q(3),
          "L3",
          "Tìm hai đồ vật giống nhau.",
          ["book", "pencil", "backpack", "ball"],
          [0, 2, 4, 6, 3, 1, 7, 5],
          4,
        ),
        memoryLetters(
          q(4),
          "L3",
          ["M", "N", "O", "Ô", "Ơ", "P"],
          [0, 2, 4, 6, 8, 10, 1, 3, 11, 5, 7, 9],
          4,
        ),
      ],
    }),
  ],
  "mg-s2": [
    lesson({
      id: "mg-l7",
      title: "Nhìn kỹ, nhớ lâu",
      objective: "Con sẽ nhìn thật kỹ rồi nhớ lại hình vừa thấy.",
      cover: P.orange[1],
      build: (q) => [
        seen(q(1), "L1", ["dog"], ["cat", "bird", "dog"]),
        seen(q(2), "L1", ["grapes"], ["grapes", "apple", "banana"]),
        seen(q(3), "L2", ["circle", "ball"], ["square", "ball", "star"], 4),
        seen(q(4), "L2", ["book", "chicken"], ["pencil", "fish", "chicken"], 4),
        seen(
          q(5),
          "L3",
          ["red", "yellow", "blue"],
          ["green", "yellow", "purple"],
          5,
        ),
      ],
    }),
    lesson({
      id: "mg-l8",
      title: "Nhớ thứ tự dài hơn",
      objective: "Con sẽ nhớ và xếp lại bốn hình theo đúng thứ tự.",
      cover: P.pencil[1],
      build: (q) => [
        recall(q(1), "L2", ["cat", "dog", "fish"], [2, 0, 1]),
        recall(q(2), "L2", ["red", "green", "yellow"], [1, 2, 0]),
        recall(
          q(3),
          "L3",
          ["apple", "banana", "orange", "grapes"],
          [3, 1, 0, 2],
          5,
        ),
        recall(
          q(4),
          "L3",
          ["star", "circle", "triangle", "square"],
          [2, 3, 1, 0],
          5,
        ),
        seen(q(5), "L2", ["bird", "ball"], ["ball", "book", "dog"], 4),
      ],
    }),
  ],

  // ── Đảo Tiếng Anh ──
  "ei-s1": [
    lesson({
      id: "ei-l5",
      title: "Colours review",
      objective: "Con sẽ ôn lại tên các màu bằng tiếng Anh.",
      cover: P.green[1],
      build: () => [
        findEn("ei-l5-q1", "red", "màu đỏ", ["blue", "red", "green"], 1),
        findEn(
          "ei-l5-q2",
          "green",
          "màu xanh lá",
          ["green", "yellow", "purple"],
          0,
        ),
        findEn(
          "ei-l5-q3",
          "purple",
          "màu tím",
          ["red", "orangeColor", "purple"],
          2,
        ),
        findEn(
          "ei-l5-q4",
          "orange",
          "màu cam",
          ["orangeColor", "blue", "yellow"],
          0,
        ),
        findEn("ei-l5-q5", "yellow", "màu vàng", ["green", "yellow", "red"], 1),
      ],
    }),
    lesson({
      id: "ei-l6",
      title: "Colours everywhere",
      objective: "Con sẽ nghe và tìm đúng màu thật nhanh.",
      cover: P.yellow[1],
      build: () => [
        findEn(
          "ei-l6-q1",
          "blue",
          "màu xanh dương",
          ["purple", "green", "blue"],
          2,
        ),
        findEn("ei-l6-q2", "purple", "màu tím", ["purple", "blue", "red"], 0),
        findEn(
          "ei-l6-q3",
          "green",
          "màu xanh lá",
          ["yellow", "green", "orangeColor"],
          1,
        ),
        findEn(
          "ei-l6-q4",
          "red",
          "màu đỏ",
          ["orangeColor", "purple", "red"],
          2,
        ),
        findEn(
          "ei-l6-q5",
          "orange",
          "màu cam",
          ["yellow", "orangeColor", "red"],
          1,
        ),
      ],
    }),
  ],
  "ei-s2": [
    lesson({
      id: "ei-l7",
      title: "Animals",
      objective: "Con sẽ nghe tên con vật tiếng Anh và tìm hình.",
      cover: P.chicken[1],
      build: () => [
        findEn(
          "ei-l7-q1",
          "the chicken",
          "con gà",
          ["chicken", "bird", "dog"],
          0,
        ),
        findEn("ei-l7-q2", "the fish", "con cá", ["cat", "fish", "chicken"], 1),
        findEn("ei-l7-q3", "the dog", "con chó", ["bird", "cat", "dog"], 2),
        findEn("ei-l7-q4", "the bird", "con chim", ["bird", "fish", "cat"], 0),
        findEn("ei-l7-q5", "the cat", "con mèo", ["dog", "cat", "chicken"], 1),
      ],
    }),
    lesson({
      id: "ei-l8",
      title: "Things and fruit",
      objective: "Con sẽ tìm đồ vật và quả quen thuộc bằng tiếng Anh.",
      cover: P.banana[1],
      build: () => [
        findEn(
          "ei-l8-q1",
          "the banana",
          "quả chuối",
          ["apple", "grapes", "banana"],
          2,
        ),
        findEn(
          "ei-l8-q2",
          "the pencil",
          "bút chì",
          ["pencil", "book", "ball"],
          0,
        ),
        findEn(
          "ei-l8-q3",
          "the book",
          "quyển sách",
          ["backpack", "book", "pencil"],
          1,
        ),
        findEn(
          "ei-l8-q4",
          "the apple",
          "quả táo",
          ["orange", "banana", "apple"],
          2,
        ),
        findEn(
          "ei-l8-q5",
          "the ball",
          "quả bóng",
          ["ball", "apple", "orange"],
          0,
        ),
      ],
    }),
  ],

  // ── Thị Trấn Trường Học ──
  "st-s1": [
    lesson({
      id: "st-l5",
      title: "Chuẩn bị đi học",
      objective: "Con sẽ chọn đúng đồ cần mang đi học.",
      cover: P.backpack[1],
      build: (q) => [
        choose(q(1), "L1", "Đâu là cặp sách?", ["ball", "backpack", "bowl"], 1),
        choose(
          q(2),
          "L1",
          "Con đựng sách vở vào đâu?",
          ["bowl", "ball", ["backpack", "Cặp sách"]],
          2,
        ),
        choose(q(3), "L1", "Đâu là bút chì?", ["pencil", "book", "ball"], 0),
        choose(
          q(4),
          "L2",
          "Cái nào không phải đồ dùng học tập?",
          ["book", "pencil", "ball"],
          2,
        ),
        memory(
          q(5),
          "L2",
          "Tìm hai đồ dùng giống nhau.",
          ["book", "pencil", "backpack"],
          [0, 2, 4, 1, 5, 3],
          3,
        ),
      ],
    }),
    lesson({
      id: "st-l6",
      title: "Đếm đồ dùng",
      objective: "Con sẽ đếm sách, bút và cặp.",
      cover: group("object.book", 3),
      build: (q) => [
        count(q(1), "L1", "book", "quyển sách", 3, [3, 4, 2]),
        count(q(2), "L2", "pencil", "bút chì", 5, [4, 6, 5]),
        groupOf(q(3), "L2", "backpack", "cặp sách", 2, [3, 2, 1]),
        matchCount(q(4), "L2", "book", "quyển sách", [1, 3, 2], [2, 0, 1]),
        orderGroups(q(5), "L2", "pencil", "bút chì", [4, 1, 3]),
      ],
    }),
  ],
  "st-s2": [
    lesson({
      id: "st-l7",
      title: "Một ngày của bé",
      objective: "Con sẽ biết việc cần làm vào từng lúc trong ngày.",
      cover: P.toothbrush[1],
      build: (q) => [
        choose(
          q(1),
          "L1",
          "Thức dậy buổi sáng, con làm gì trước?",
          [
            ["bed", "Đi ngủ"],
            ["toothbrush", "Đánh răng"],
            ["ball", "Chơi bóng"],
          ],
          1,
        ),
        choose(
          q(2),
          "L1",
          "Khi tay bị bẩn, con làm gì?",
          [
            ["soap", "Rửa tay"],
            ["bed", "Đi ngủ"],
            ["book", "Đọc sách"],
          ],
          0,
        ),
        choose(
          q(3),
          "L1",
          "Đến giờ ăn trưa, con làm gì?",
          [
            ["ball", "Chơi bóng"],
            ["backpack", "Đi học"],
            ["bowl", "Ăn cơm"],
          ],
          2,
        ),
        routine(
          q(4),
          "L2",
          "Xếp việc buổi tối theo thứ tự.",
          [
            ["bowl", "Ăn tối"],
            ["toothbrush", "Đánh răng"],
            ["bed", "Đi ngủ"],
          ],
          [2, 0, 1],
          "Việc nào làm sau cùng trước khi ngủ?",
        ),
        routine(
          q(5),
          "L2",
          "Xếp việc trước bữa ăn theo thứ tự.",
          [
            ["soap", "Rửa tay"],
            ["bowl", "Ăn cơm"],
            ["toothbrush", "Đánh răng"],
          ],
          [1, 2, 0],
          "Trước khi ăn, con làm gì?",
        ),
      ],
    }),
    lesson({
      id: "st-l8",
      title: "Lắng nghe lời cô",
      objective: "Con sẽ nghe và làm theo hướng dẫn dài hơn.",
      cover: P.book[1],
      build: (q) => [
        follow(q(1), "L2", ["orange", "apple", "banana"], [1, 2, 0]),
        follow(q(2), "L2", ["cat", "fish", "bird"], [2, 0, 1]),
        follow(q(3), "L2", ["square", "star", "circle"], [0, 2, 1]),
        follow(q(4), "L3", ["book", "pencil", "backpack"], [1, 2, 0]),
        choose(
          q(5),
          "L1",
          "Đèn giao thông màu gì thì phải dừng lại?",
          [
            ["green", "Màu xanh"],
            ["red", "Màu đỏ"],
            ["yellow", "Màu vàng"],
          ],
          1,
          "Đèn đỏ: dừng lại.",
        ),
      ],
    }),
  ],

  // ── Đấu Trường Thử Thách ──
  "ca-s1": [
    lesson({
      id: "ca-l5",
      title: "Thử thách số 5",
      objective: "Con sẽ đếm, tìm chữ, tìm quy luật và nghe tiếng Anh.",
      cover: P.star[1],
      build: (q) => [
        count(q(1), "L2", "bird", "con chim", 7, [6, 7, 8]),
        findLetter(q(2), "L2", "Ơ", ["Ô", "O", "Ơ"]),
        pattern(
          q(3),
          "L2",
          "Chọn hình tiếp theo.",
          ["star", "star", "circle"],
          5,
          1,
          ["circle", "star", "square"],
        ),
        findEn("ca-l5-q4", "the dog", "con chó", ["dog", "cat", "fish"], 0),
        extreme(q(5), "L2", "lớn", [4, 9, 7]),
      ],
    }),
    lesson({
      id: "ca-l6",
      title: "Thử thách số 6",
      objective: "Con sẽ nghe âm đầu, ghi nhớ và so sánh.",
      cover: P.grapes[1],
      build: (q) => [
        initial(
          q(1),
          "L2",
          "C",
          [
            ["dog", "chó"],
            ["orange", "cam"],
            ["chicken", "gà"],
          ],
          "Cờ… cam. Chó bắt đầu bằng “ch” nhé.",
        ),
        memory(
          q(2),
          "L2",
          "Tìm hai quả giống nhau.",
          ["banana", "grapes", "apple"],
          [2, 0, 4, 1, 5, 3],
          3,
        ),
        orderNumbers(q(3), "L2", [6, 3, 5, 4]),
        choose(
          q(4),
          "L2",
          "Cái nào không phải là con vật?",
          ["cat", "pencil", "chicken"],
          1,
        ),
        seen(q(5), "L2", ["star", "fish"], ["fish", "dog", "square"], 4),
      ],
    }),
  ],
  "ca-s2": [
    lesson({
      id: "ca-l7",
      title: "Thử thách số 7",
      objective: "Con sẽ nối, đếm tiếp và làm theo lời cô.",
      cover: P.orange[1],
      build: (q) => [
        matchCount(q(1), "L2", "apple", "quả táo", [2, 5, 3], [2, 0, 1]),
        neighbour(q(2), "L2", 8, "sau", [7, 9, 10]),
        findEn("ca-l7-q3", "purple", "màu tím", ["blue", "red", "purple"], 2),
        follow(q(4), "L3", ["chicken", "dog", "cat"], [2, 0, 1]),
        pattern(
          q(5),
          "L3",
          "Chọn hai màu còn thiếu.",
          ["green", "yellow"],
          4,
          2,
          ["yellow", "green", "red"],
        ),
      ],
    }),
    lesson({
      id: "ca-l8",
      title: "Thử thách số 8",
      objective: "Con sẽ so sánh, ghi nhớ thứ tự và tìm điểm khác.",
      cover: P.ball[1],
      build: (q) => [
        moreLess(q(1), "L2", "ít", "fish", "con cá", [5, 7, 2]),
        findLetter(q(2), "L2", "Ư", ["Ư", "U", "Ơ"]),
        recall(q(3), "L3", ["ball", "book", "apple"], [2, 0, 1]),
        count(q(4), "L2", "chicken", "con gà", 6, [5, 7, 6]),
        choose(
          q(5),
          "L2",
          "Hình nào khác các hình còn lại?",
          ["triangle", "square", "triangle"],
          1,
        ),
      ],
    }),
  ],
};

/** Answer keys of the expansion (derived above, never typed by hand). */
export const EXPANSION_KEYS: Readonly<Record<string, AnswerKey>> = KEYS;
