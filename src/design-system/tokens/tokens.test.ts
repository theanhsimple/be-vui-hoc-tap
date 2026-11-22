import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BRAND,
  CONTRAST_REQUIREMENTS,
  SEMANTIC,
  contrastRatio,
} from "./colors";
import { RADIUS } from "./scale";

const css = readFileSync(
  join(process.cwd(), "src/styles/tokens.css"),
  "utf8",
).toLowerCase();
const cssVar = (name: string) =>
  css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`))?.[1];

const kebab = (s: string) =>
  s
    .replace(/([A-Z])/g, "-$1")
    .replace(/(\d+)/g, "-$1")
    .toLowerCase();

describe("design tokens", () => {
  it("brand colours match tokens.css", () => {
    for (const [name, t] of Object.entries(BRAND)) {
      expect(cssVar(name), name).toBe(t.base.toLowerCase());
      expect(cssVar(`${name}-50`), `${name}-50`).toBe(t.tint.toLowerCase());
      expect(cssVar(`${name}-edge`), `${name}-edge`).toBe(t.edge.toLowerCase());
      expect(cssVar(`${name}-strong`), `${name}-strong`).toBe(
        t.strong.toLowerCase(),
      );
    }
  });

  it("semantic colours match tokens.css", () => {
    for (const [name, hex] of Object.entries(SEMANTIC)) {
      expect(cssVar(kebab(name)), name).toBe(hex.toLowerCase());
    }
  });

  it("radii match tokens.css", () => {
    for (const [name, px] of Object.entries(RADIUS)) {
      expect(css).toContain(`--radius-${name}: ${px}px`);
    }
  });

  it.each(CONTRAST_REQUIREMENTS)(
    "contrast: $use ≥ $min:1",
    ({ fg, bg, min }) => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
    },
  );

  it("computes known WCAG ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
});
