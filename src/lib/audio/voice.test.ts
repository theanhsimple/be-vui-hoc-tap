import { describe, expect, it } from "vitest";

import { pickVoice } from "./voice";

describe("pickVoice", () => {
  it("prefers an exact language-tag match", () => {
    const voices = [
      { lang: "vi", name: "Generic" },
      { lang: "vi-VN", name: "Linh" },
    ];
    expect(pickVoice(voices, "vi-VN")?.name).toBe("Linh");
  });

  it("accepts underscores and different casing", () => {
    expect(pickVoice([{ lang: "VI_vn", name: "An" }], "vi-VN")?.name).toBe(
      "An",
    );
  });

  it("falls back to the same base language", () => {
    expect(pickVoice([{ lang: "en-GB", name: "Daniel" }], "en-US")?.name).toBe(
      "Daniel",
    );
  });

  it("prefers local voices among equal matches", () => {
    const voices = [
      { lang: "vi-VN", name: "Cloud", localService: false },
      { lang: "vi-VN", name: "Local", localService: true },
    ];
    expect(pickVoice(voices, "vi-VN")?.name).toBe("Local");
  });

  it("returns null when no voice speaks the language", () => {
    expect(
      pickVoice([{ lang: "en-US", name: "Samantha" }], "vi-VN"),
    ).toBeNull();
  });
});
