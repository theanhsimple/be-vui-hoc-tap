import { describe, expect, it } from "vitest";

import { contentRepository } from "../content/repository";
import type { LearningQuestion } from "../types";
import { requestHint, submitAnswer } from "./actions";
import { gradeResponse, responseMatchesQuestion } from "./grade";

const q = (lessonId: string, i: number) =>
  contentRepository.getLesson(lessonId)!.questions[i]!;

describe("gradeResponse", () => {
  const choiceQ = q("nk-l3", 0); // "Đâu là hình tròn?" → c
  const key = { type: "choice" as const, optionId: "c" };

  it("correct on first try → final, no reveal", () => {
    const r = gradeResponse(
      choiceQ,
      key,
      { type: "image_choice", optionId: "c" },
      1,
    );
    expect(r).toMatchObject({ correct: true, final: true });
    expect(r.reveal).toBeUndefined();
  });

  it("wrong before the last try → not final and does not reveal the answer", () => {
    const r = gradeResponse(
      choiceQ,
      key,
      { type: "image_choice", optionId: "a" },
      1,
    );
    expect(r).toMatchObject({ correct: false, final: false });
    expect(r.reveal).toBeUndefined();
    expect(r.message).toMatch(/thử lại/);
  });

  it("wrong on the last try → final with the answer revealed", () => {
    const r = gradeResponse(
      choiceQ,
      key,
      { type: "image_choice", optionId: "a" },
      2,
    );
    expect(r).toMatchObject({
      correct: false,
      final: true,
      reveal: { type: "choice", optionId: "c" },
    });
  });

  it("respects a per-question maxAttempts", () => {
    const three: LearningQuestion = { ...choiceQ, maxAttempts: 3 };
    expect(
      gradeResponse(three, key, { type: "image_choice", optionId: "a" }, 2)
        .final,
    ).toBe(false);
  });

  it("matching ignores pair order; ordering and pattern compare in order", () => {
    const m = {
      type: "matching" as const,
      pairs: [
        ["l1", "r2"],
        ["l2", "r1"],
      ] as Array<[string, string]>,
    };
    expect(
      gradeResponse(
        q("af-l1", 2),
        m,
        {
          type: "matching",
          pairs: [
            ["l2", "r1"],
            ["l1", "r2"],
          ],
        },
        1,
      ).correct,
    ).toBe(true);
    const o = { type: "ordering" as const, order: ["a", "b"] };
    expect(
      gradeResponse(
        q("nk-l1", 2),
        o,
        { type: "ordering", order: ["b", "a"] },
        1,
      ).correct,
    ).toBe(false);
  });

  it("memory counts completion as success", () => {
    expect(
      gradeResponse(
        q("mg-l1", 0),
        { type: "memory" },
        { type: "memory", moves: 9 },
        1,
      ).correct,
    ).toBe(true);
  });

  it("rejects responses for the wrong type or unknown options", () => {
    expect(
      responseMatchesQuestion(choiceQ, {
        type: "image_choice",
        optionId: "zzz",
      }),
    ).toBe(false);
    expect(
      responseMatchesQuestion(choiceQ, { type: "ordering", order: [] }),
    ).toBe(false);
  });
});

describe("submitAnswer / requestHint server actions", () => {
  it("grades against the server-side key", async () => {
    await expect(
      submitAnswer({
        lessonId: "nk-l1",
        questionId: "nk-l1-q1",
        attempt: 1,
        response: { type: "single_choice", optionId: "b" },
      }),
    ).resolves.toMatchObject({ correct: true });
    await expect(
      submitAnswer({
        lessonId: "nk-l1",
        questionId: "nk-l1-q1",
        attempt: 1,
        response: { type: "single_choice", optionId: "a" },
      }),
    ).resolves.toMatchObject({ correct: false, final: false });
  });

  it("rejects malformed or mismatched input (actions are public endpoints)", async () => {
    await expect(
      submitAnswer({
        lessonId: "nk-l1",
        questionId: "../etc",
        attempt: 1,
        response: { type: "memory", moves: 1 },
      }),
    ).rejects.toThrow();
    await expect(
      submitAnswer({
        lessonId: "nk-l1",
        questionId: "af-l1-q1",
        attempt: 1,
        response: { type: "single_choice", optionId: "b" },
      }),
    ).rejects.toThrow("Unknown question");
    await expect(
      submitAnswer({
        lessonId: "nk-l1",
        questionId: "nk-l1-q1",
        attempt: 0,
        response: { type: "single_choice", optionId: "b" },
      }),
    ).rejects.toThrow();
    await expect(
      submitAnswer({
        lessonId: "nk-l1",
        questionId: "nk-l1-q1",
        attempt: 1,
        response: { type: "ordering", order: ["b"] },
      }),
    ).rejects.toThrow("Invalid response");
  });

  it("hints fade out a wrong option, never the right one", async () => {
    const h = await requestHint({ lessonId: "nk-l1", questionId: "nk-l1-q1" });
    expect(h.text.length).toBeGreaterThan(0);
    expect(h.eliminateOptionId).toBeDefined();
    expect(h.eliminateOptionId).not.toBe("b");
  });
});
