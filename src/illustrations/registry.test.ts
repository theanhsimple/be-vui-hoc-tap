import { describe, expect, it } from "vitest";

import { LEARNING_WORLDS } from "@/design-system/worlds";

import { ILLUSTRATION_NAMES, assetPath, getIllustration } from "./registry";

describe("illustration registry", () => {
  it("uses {category}.{kebab-name} keys", () => {
    for (const name of ILLUSTRATION_NAMES) {
      expect(name).toMatch(
        /^(world|object|shape|reward|avatar|mascot|state)\.[a-z0-9]+(-[a-z0-9]+)*$/,
      );
    }
  });

  it("maps keys to the asset path convention", () => {
    expect(assetPath("world.iq-castle")).toBe(
      "/illustrations/world/iq-castle@2x.webp",
    );
  });

  it("has art for all seven learning worlds", () => {
    expect(LEARNING_WORLDS).toHaveLength(7);
    for (const w of LEARNING_WORLDS)
      expect(getIllustration(w.illustration).kind).toBeDefined();
  });
});
