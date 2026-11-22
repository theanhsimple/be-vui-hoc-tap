import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { contentRepository } from "@/features/learning/content/repository";
import type { AnswerKey } from "@/features/learning/grading/keys";
import type {
  LearningQuestion,
  QuestionOption,
  Visual,
} from "@/features/learning/types";

import { DEMO_ANSWER_KEYS } from "./answer-keys";

const catalog = contentRepository.getCatalog();
const lessons = contentRepository
  .listLessonIds()
  .map((id) => contentRepository.getLesson(id)!);
const questions = lessons.flatMap((l) => l.questions);
const key = (q: LearningQuestion) => DEMO_ANSWER_KEYS[q.id] as AnswerKey;

const visualId = (v: Visual) =>
  v.kind === "illustration"
    ? v.name
    : v.kind === "glyph"
      ? `glyph:${v.text}`
      : `group:${v.name}:${v.count}`;
const optionsOf = (q: LearningQuestion): QuestionOption[] =>
  "options" in q
    ? q.options
    : q.type === "ordering"
      ? q.config.items
      : q.type === "pattern"
        ? q.config.palette
        : [];
const byId = (list: QuestionOption[], id: string) =>
  list.find((o) => o.id === id)!;
const numberOf = (o: QuestionOption) =>
  o.visual.kind === "glyph"
    ? Number(o.visual.text)
    : o.visual.kind === "group"
      ? o.visual.count
      : NaN;
const chosen = (q: LearningQuestion) => {
  const k = key(q);
  return k.type === "choice" ? byId(optionsOf(q), k.optionId) : undefined;
};

describe("demo content library — structure", () => {
  it("has 7 worlds, ≥2 skills and ≥2 lessons each, ≥3 questions per lesson, 84 questions", () => {
    expect(catalog.worlds).toHaveLength(7);
    for (const w of catalog.worlds) {
      expect(w.skills.length, w.id).toBeGreaterThanOrEqual(2);
      expect(
        w.skills.flatMap((s) => s.lessons).length,
        w.id,
      ).toBeGreaterThanOrEqual(2);
    }
    for (const l of lessons)
      expect(l.questions.length, l.id).toBeGreaterThanOrEqual(3);
    expect(questions).toHaveLength(84);
  });

  it("uses all six question types", () => {
    const counts = Object.fromEntries(
      [
        "single_choice",
        "image_choice",
        "matching",
        "ordering",
        "pattern",
        "memory",
      ].map((t) => [t, questions.filter((q) => q.type === t).length]),
    );
    for (const [type, n] of Object.entries(counts))
      expect(n, type).toBeGreaterThanOrEqual(5);
  });

  it("has unique question ids and unique option ids per question", () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const q of questions) {
      const ids =
        q.type === "matching"
          ? [...q.config.left, ...q.config.right].map((o) => o.id)
          : q.type === "memory"
            ? q.config.cards.map((c) => c.id)
            : optionsOf(q).map((o) => o.id);
      expect(new Set(ids).size, q.id).toBe(ids.length);
    }
  });

  it("keeps prompts short", () => {
    for (const q of questions)
      expect(q.prompt.length, q.id).toBeLessThanOrEqual(60);
  });
});

describe("demo content library — answer keys", () => {
  it("every question has exactly one key, and no key is orphaned", () => {
    expect(Object.keys(DEMO_ANSWER_KEYS).sort()).toEqual(
      questions.map((q) => q.id).sort(),
    );
  });

  it.each(questions.map((q) => [q.id, q] as const))(
    "%s: key is consistent with the question",
    (_, q) => {
      const k = key(q);
      switch (q.type) {
        case "single_choice":
        case "image_choice":
          expect(k.type).toBe("choice");
          if (k.type === "choice") {
            expect(q.options.map((o) => o.id)).toContain(k.optionId);
            if (k.hintEliminate) {
              expect(q.options.map((o) => o.id)).toContain(k.hintEliminate);
              expect(k.hintEliminate).not.toBe(k.optionId);
            }
          }
          break;
        case "matching":
          expect(k.type).toBe("matching");
          if (k.type === "matching") {
            expect(k.pairs.map((p) => p[0]).sort()).toEqual(
              q.config.left.map((o) => o.id).sort(),
            );
            expect(k.pairs.map((p) => p[1]).sort()).toEqual(
              q.config.right.map((o) => o.id).sort(),
            );
          }
          break;
        case "ordering":
          expect(k.type).toBe("ordering");
          if (k.type === "ordering") {
            expect([...k.order].sort()).toEqual(
              q.config.items.map((o) => o.id).sort(),
            );
            expect(
              k.order,
              "items must not already be in the right order",
            ).not.toEqual(q.config.items.map((o) => o.id));
          }
          break;
        case "pattern":
          expect(k.type).toBe("pattern");
          if (k.type === "pattern") {
            expect(k.fills).toHaveLength(
              q.config.sequence.filter((c) => c === null).length,
            );
            for (const f of k.fills)
              expect(q.config.palette.map((o) => o.id)).toContain(f);
          }
          break;
        case "memory": {
          expect(k.type).toBe("memory");
          const counts = new Map<string, number>();
          for (const c of q.config.cards)
            counts.set(c.pairKey, (counts.get(c.pairKey) ?? 0) + 1);
          for (const n of counts.values()) expect(n).toBe(2);
          q.config.cards.forEach((c, i) => {
            if (i > 0)
              expect(c.pairKey, "pairs should not sit side by side").not.toBe(
                q.config.cards[i - 1]!.pairKey,
              );
          });
          break;
        }
      }
    },
  );

  it("correct answers are not always in the same position", () => {
    const positions = questions
      .filter((q) => key(q).type === "choice")
      .map((q) =>
        optionsOf(q).findIndex(
          (o) => o.id === (key(q) as { optionId: string }).optionId,
        ),
      );
    for (const p of [0, 1, 2])
      expect(positions.filter((x) => x === p).length).toBeGreaterThanOrEqual(
        10,
      );
  });
});

/** Recomputes answers from the content itself, so a typo in the key file is caught. */
describe("demo content library — semantic answer checks", () => {
  const find = (re: RegExp) => questions.filter((q) => re.test(q.prompt));

  it("counting questions: the answer equals the number of objects shown", () => {
    const qs = find(/^Có bao nhiêu/);
    expect(qs.length).toBeGreaterThanOrEqual(4);
    for (const q of qs) {
      expect(q.stimulus?.kind).toBe("group");
      if (q.stimulus?.kind === "group")
        expect(numberOf(chosen(q)!), q.id).toBe(q.stimulus.count);
      const counts = optionsOf(q).map(numberOf);
      expect(
        counts.filter((n) => n === (q.stimulus as { count: number }).count),
        "exactly one right option",
      ).toHaveLength(1);
    }
  });

  it("'Đâu là chữ X?' picks letter X", () => {
    for (const q of find(/^Đâu là chữ (.)\?$/)) {
      const letter = q.prompt.match(/^Đâu là chữ (.)\?$/)![1];
      expect(chosen(q)?.label, q.id).toBe(`Chữ ${letter}`);
    }
  });

  it("largest/smallest number questions", () => {
    for (const q of find(/^Số nào (lớn|bé) nhất\?$/)) {
      const nums = optionsOf(q).map(numberOf);
      const want = q.prompt.includes("lớn")
        ? Math.max(...nums)
        : Math.min(...nums);
      expect(numberOf(chosen(q)!), q.id).toBe(want);
    }
  });

  it("'Nhóm nào có N …' and 'nhiều/ít hơn' questions", () => {
    for (const q of find(/^Nhóm nào có \d/))
      expect(numberOf(chosen(q)!), q.id).toBe(
        Number(q.prompt.match(/\d+/)![0]),
      );
    for (const q of find(/^Nhóm nào có (nhiều|ít)/)) {
      const nums = optionsOf(q).map(numberOf);
      expect(numberOf(chosen(q)!), q.id).toBe(
        q.prompt.includes("nhiều") ? Math.max(...nums) : Math.min(...nums),
      );
    }
  });

  it("ordering by size/quantity is ascending", () => {
    for (const q of find(/^Xếp (các số từ bé đến lớn|từ ít đến nhiều)/)) {
      const k = key(q) as Extract<AnswerKey, { type: "ordering" }>;
      const values = k.order.map((id) => numberOf(byId(optionsOf(q), id)));
      expect(values, q.id).toEqual([...values].sort((a, b) => a - b));
    }
  });

  it("'remember the order' answers match what was shown", () => {
    for (const q of questions.filter(
      (q) => q.type === "ordering" && q.memorize,
    )) {
      const k = key(q) as Extract<AnswerKey, { type: "ordering" }>;
      expect(
        k.order.map((id) => visualId(byId(optionsOf(q), id).visual)),
        q.id,
      ).toEqual(q.memorize!.visuals.map(visualId));
    }
  });

  it("'what did you see' answers: exactly one option was shown", () => {
    for (const q of questions.filter(
      (q) => q.type === "image_choice" && q.memorize,
    )) {
      const shown = new Set(q.memorize!.visuals.map(visualId));
      const seen = optionsOf(q).filter((o) => shown.has(visualId(o.visual)));
      expect(
        seen.map((o) => o.id),
        q.id,
      ).toEqual([(key(q) as { optionId: string }).optionId]);
    }
  });

  it("'follow the teacher' ordering matches the spoken list", () => {
    for (const q of find(/^Xếp theo lời cô: /)) {
      const spoken = q.prompt
        .replace("Xếp theo lời cô: ", "")
        .replace(/\.$/, "")
        .split(", ");
      const k = key(q) as Extract<AnswerKey, { type: "ordering" }>;
      expect(
        k.order.map((id) => byId(optionsOf(q), id).label.toLowerCase()),
        q.id,
      ).toEqual(spoken);
    }
  });

  it("initial-sound questions are unambiguous", () => {
    const qs = find(/bắt đầu bằng chữ (.)\?$/);
    expect(qs.length).toBeGreaterThanOrEqual(4);
    for (const q of qs) {
      const letter = q.prompt.match(/chữ (.)\?$/)![1]!.toLowerCase();
      const starts = optionsOf(q).filter((o) =>
        o.label.toLowerCase().startsWith(letter),
      );
      // "ch" is a different sound from "c" in Vietnamese.
      const real = starts.filter(
        (o) => !(letter === "c" && o.label.toLowerCase().startsWith("ch")),
      );
      expect(
        real.map((o) => o.id),
        q.id,
      ).toEqual([(key(q) as { optionId: string }).optionId]);
    }
  });

  it("upper/lower-case letter matching pairs the same letter", () => {
    for (const q of questions.filter(
      (q) => q.type === "matching" && q.prompt.includes("chữ thường"),
    )) {
      if (q.type !== "matching") continue;
      const k = key(q) as Extract<AnswerKey, { type: "matching" }>;
      for (const [l, r] of k.pairs) {
        const left = byId(q.config.left, l).visual;
        const right = byId(q.config.right, r).visual;
        expect(
          left.kind === "glyph" &&
            right.kind === "glyph" &&
            left.text.toLowerCase() === right.text,
          q.id,
        ).toBe(true);
      }
    }
  });

  it("group-to-number matching pairs equal quantities", () => {
    const qs = questions.filter(
      (q) => q.type === "matching" && q.prompt.includes("số đúng"),
    );
    expect(qs.length).toBeGreaterThanOrEqual(1);
    for (const q of qs) {
      if (q.type !== "matching") continue;
      const k = key(q) as Extract<AnswerKey, { type: "matching" }>;
      for (const [l, r] of k.pairs)
        expect(numberOf(byId(q.config.left, l)), q.id).toBe(
          numberOf(byId(q.config.right, r)),
        );
    }
  });

  it("pattern blanks continue the repeating unit", () => {
    for (const q of questions.filter((q) => q.type === "pattern")) {
      if (q.type !== "pattern") continue;
      const seq = q.config.sequence.map((o) => (o ? visualId(o.visual) : null));
      const known = seq.filter((v): v is string => v !== null);
      const period = [1, 2, 3, 4].find((p) =>
        known.every((v, i) => i < p || v === known[i - p]),
      )!;
      expect(period, q.id).toBeDefined();
      const expected = seq
        .map((v, i) => v ?? known[i % period]!)
        .filter((_, i) => seq[i] === null);
      const k = key(q) as Extract<AnswerKey, { type: "pattern" }>;
      expect(
        k.fills.map((id) => visualId(byId(q.config.palette, id).visual)),
        q.id,
      ).toEqual(expected);
    }
  });

  it("English 'Find …' questions pick the named picture", () => {
    const words: Record<string, string> = {
      red: "color.red",
      blue: "color.blue",
      yellow: "color.yellow",
      green: "color.green",
      orange: "color.orange",
      purple: "color.purple",
      "the cat": "animal.cat",
      "the dog": "animal.dog",
      "the fish": "animal.fish",
      "the bird": "animal.bird",
      "the book": "object.book",
      "the ball": "object.ball",
      "the apple": "food.apple",
    };
    const qs = find(/^Find /);
    expect(qs.length).toBeGreaterThanOrEqual(12);
    for (const q of qs) {
      const word = q.prompt.match(/^Find (.+?)!/)![1]!;
      expect(visualId(chosen(q)!.visual), q.id).toBe(words[word]);
    }
  });

  it("'Đâu là <thing>?' picks the option with that name", () => {
    for (const q of find(/^Đâu là (hình|quyển|bút|cặp)/)) {
      const thing = q.prompt.match(/^Đâu là (.+)\?$/)![1]!.toLowerCase();
      expect(chosen(q)?.label.toLowerCase(), q.id).toBe(thing);
    }
  });
});

describe("answer keys stay on the server", () => {
  it("the keys module is marked server-only", () => {
    const src = readFileSync(
      join(process.cwd(), "src/data/demo/answer-keys.ts"),
      "utf8",
    );
    expect(src.startsWith('import "server-only";')).toBe(true);
  });

  it("public content files never import or contain answer keys", () => {
    const dir = join(process.cwd(), "src/data/demo/worlds");
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), "utf8");
      expect(src, f).not.toMatch(/answer-keys|optionId|hintEliminate/);
    }
  });

  it("no client component imports the keys", () => {
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)],
      );
    const offenders = walk(join(process.cwd(), "src"))
      .filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts"))
      .filter((f) => {
        const src = readFileSync(f, "utf8");
        return (
          src.includes("answer-keys") &&
          !f.endsWith("grading/actions.ts") &&
          !f.endsWith("answer-keys.ts")
        );
      });
    expect(offenders).toEqual([]);
  });
});
