// @vitest-environment node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { DEMO_WORLD_SOURCES } from "./index";
import { PLACEMENT_ASSESSMENT, SKILL_GUIDES } from "./parent-guides";
import { buildSeedSql, seedStats } from "./seed-sql";

const SEED_PATH = resolve(process.cwd(), "supabase/seed.sql");

describe("supabase/seed.sql", () => {
  it("migrates the whole demo library (no silent shrink)", () => {
    expect(seedStats()).toEqual({
      modules: 7,
      skills: 14,
      lessons: 28,
      questions: 84,
      keys: 84,
      rewards: 6,
    });
  });

  it("is up to date with the TypeScript source", () => {
    const expected = buildSeedSql();
    if (process.env.UPDATE_SEED === "1") writeFileSync(SEED_PATH, expected);
    expect(readFileSync(SEED_PATH, "utf8")).toBe(expected);
  });

  it("never ships hint/answer data in public columns", () => {
    const sql = buildSeedSql();
    const publicInserts = sql
      .split("\n")
      .filter(
        (l) => l.startsWith("values (") && !l.includes("question_answer_keys"),
      );
    // Public question rows contain no `optionId` / `pairs` / `order` / `fills` keys.
    const questionRows = publicInserts.filter((l) =>
      l.includes("(select id from public.skills where slug"),
    );
    for (const row of questionRows) {
      expect(row).not.toMatch(
        /"optionId"|"pairs"|"order"|"fills"|hintEliminate/,
      );
    }
  });

  it("has a parent guide for every skill and nothing extra", () => {
    const skills = DEMO_WORLD_SOURCES.flatMap((w) => w.skills.map((s) => s.id));
    expect(Object.keys(SKILL_GUIDES).sort()).toEqual([...skills].sort());
    for (const g of Object.values(SKILL_GUIDES)) {
      expect(g.summary.length).toBeGreaterThan(0);
      expect(g.summary.length).toBeLessThanOrEqual(300);
      expect(g.homeActivity.length).toBeLessThanOrEqual(300);
    }
  });

  it("builds the placement activity from existing, playable questions", () => {
    const questions = new Map(
      DEMO_WORLD_SOURCES.flatMap((w) =>
        w.skills.flatMap((s) =>
          s.lessons.flatMap((l) => l.questions.map((q) => [q.id, q] as const)),
        ),
      ),
    );
    const slugs = PLACEMENT_ASSESSMENT.questionSlugs;
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      const q = questions.get(slug);
      expect(q, slug).toBeDefined();
      // One try, no reveal: memory boards need many moves, so they are excluded.
      expect(q?.type).not.toBe("memory");
    }
  });
});
