import { describe, expect, it } from "vitest";

import {
  OPTION_COUNT,
  createChallenge,
  vietnameseNumberWords,
} from "./challenge";

/** Deterministic pseudo-random generator for repeatable tests. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("vietnameseNumberWords", () => {
  it.each([
    [10, "mười"],
    [11, "mười một"],
    [14, "mười bốn"],
    [15, "mười lăm"],
    [20, "hai mươi"],
    [21, "hai mươi mốt"],
    [24, "hai mươi bốn"],
    [25, "hai mươi lăm"],
    [72, "bảy mươi hai"],
    [99, "chín mươi chín"],
  ])("%i → %s", (n, words) => {
    expect(vietnameseNumberWords(n)).toBe(words);
  });

  it("rejects numbers outside 10–99", () => {
    expect(() => vietnameseNumberWords(9)).toThrow(RangeError);
    expect(() => vietnameseNumberWords(100)).toThrow(RangeError);
    expect(() => vietnameseNumberWords(12.5)).toThrow(RangeError);
  });
});

describe("createChallenge", () => {
  it("always produces a valid, solvable challenge", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const c = createChallenge(seeded(seed));
      expect(c.options).toHaveLength(OPTION_COUNT);
      expect(new Set(c.options).size).toBe(OPTION_COUNT);
      expect(c.options.filter((n) => n === c.target)).toHaveLength(1);
      expect(c.options.every((n) => n >= 10 && n <= 99)).toBe(true);
      expect(c.words).toBe(vietnameseNumberWords(c.target));
      // Never shows digits — the instruction must require reading.
      expect(c.words).not.toMatch(/\d/);
    }
  });

  it("includes the reversed-digit distractor", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const c = createChallenge(seeded(seed));
      const reversed = (c.target % 10) * 10 + Math.floor(c.target / 10);
      expect(c.options).toContain(reversed);
    }
  });
});

describe("createChallenge robustness", () => {
  it("terminates even with a constant rng", () => {
    const c = createChallenge(() => 0.42);
    expect(new Set(c.options).size).toBe(OPTION_COUNT);
  });
});
