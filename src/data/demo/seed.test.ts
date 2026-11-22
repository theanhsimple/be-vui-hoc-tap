// @vitest-environment node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

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
});
