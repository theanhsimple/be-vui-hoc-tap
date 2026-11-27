import {
  BAND_OF,
  formatDuration,
  formatWhen,
  OBSERVATION_OF,
  suggestedStart,
  type AssessmentSummary,
} from "./report-model";

describe("parent report model", () => {
  it("maps every engine state to a band and an observation without numbers", () => {
    for (const [state, band] of Object.entries(BAND_OF)) {
      expect(band).toBeTruthy();
      const text = OBSERVATION_OF[state as keyof typeof OBSERVATION_OF];
      expect(text).not.toMatch(/\d|%|điểm|xếp hạng/);
    }
    expect(BAND_OF.mastered).toBe("confident");
    expect(BAND_OF.review).toBe("developing");
  });

  it("formats durations", () => {
    expect(formatDuration(0)).toBe("0 phút");
    expect(formatDuration(30)).toBe("Dưới 1 phút");
    expect(formatDuration(12 * 60 + 20)).toBe("12 phút");
    expect(formatDuration(65 * 60)).toBe("1 giờ 5 phút");
    expect(formatDuration(120 * 60)).toBe("2 giờ");
  });

  it("formats times in Vietnam time", () => {
    const now = new Date("2026-11-27T10:00:00Z"); // 17:00 in Hanoi
    expect(formatWhen("2026-11-27T03:15:00Z", now)).toBe("Hôm nay, 10:15");
    expect(formatWhen("2026-11-26T12:05:00Z", now)).toBe("Hôm qua, 19:05");
    expect(formatWhen("2026-11-20T01:30:00Z", now)).toBe("20/11, 08:30");
  });

  it("suggests the least familiar world first, in catalogue order on ties", () => {
    const summary = {
      modules: [
        {
          moduleId: "number-kingdom",
          items: 2,
          correct: 1,
          band: "developing",
        },
        {
          moduleId: "alphabet-forest",
          items: 2,
          correct: 2,
          band: "confident",
        },
        { moduleId: "iq-castle", items: 2, correct: 1, band: "developing" },
      ],
    } as AssessmentSummary;
    expect(
      suggestedStart(summary, [
        "alphabet-forest",
        "number-kingdom",
        "iq-castle",
      ]),
    ).toBe("number-kingdom");
    expect(suggestedStart({ ...summary, modules: [] }, ["x"])).toBeUndefined();
  });
});
