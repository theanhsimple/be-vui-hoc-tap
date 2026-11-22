import { describe, expect, it } from "vitest";

import { demoContentRepository as contentRepository } from "@/data/demo/repository";
import {
  createPlayerReducer,
  initPlayer,
  type PlayerAction,
  type PlayerState,
} from "./reducer";

const questions = contentRepository.getLesson("mg-l3")!.questions; // 3 image_choice with memorize
const plain = contentRepository.getLesson("nk-l3")!.questions; // no memorize
const run = (
  qs: typeof plain,
  actions: PlayerAction[],
  start?: PlayerState,
) => {
  const r = createPlayerReducer(qs);
  return actions.reduce(r, start ?? initPlayer(qs));
};
const ok = { correct: true, final: true, message: "Đúng" };
const wrong = { correct: false, final: false, message: "Thử lại" };
const reveal = {
  correct: false,
  final: true,
  reveal: { type: "choice" as const, optionId: "c" },
  message: "Xem",
};

describe("lesson player reducer", () => {
  it("starts with memorize when the question has it", () => {
    expect(initPlayer(questions).phase).toBe("memorize");
    expect(run(questions, [{ type: "MEMORIZE_DONE" }]).phase).toBe("answering");
  });

  it("ignores duplicate submits and submits during memorize", () => {
    expect(run(questions, [{ type: "SUBMIT" }]).phase).toBe("memorize");
    const s = run(plain, [{ type: "SUBMIT" }, { type: "SUBMIT" }]);
    expect(s.phase).toBe("grading");
  });

  it("correct on first try → feedback + firstTry result", () => {
    const s = run(plain, [{ type: "SUBMIT" }, { type: "GRADED", result: ok }]);
    expect(s.phase).toBe("feedback");
    expect(s.feedback?.kind).toBe("success");
    expect(s.results).toEqual([
      { questionId: plain[0]!.id, correct: true, firstTry: true, attempts: 1 },
    ]);
  });

  it("wrong → try again on attempt 2; final wrong → reveal", () => {
    let s = run(plain, [{ type: "SUBMIT" }, { type: "GRADED", result: wrong }]);
    expect(s).toMatchObject({
      phase: "answering",
      attempt: 2,
      feedback: { kind: "tryAgain" },
    });
    expect(s.results).toHaveLength(0);
    s = run(plain, [{ type: "SUBMIT" }, { type: "GRADED", result: reveal }], s);
    expect(s).toMatchObject({
      phase: "feedback",
      feedback: { kind: "reveal" },
      reveal: reveal.reveal,
    });
    expect(s.results[0]).toMatchObject({
      correct: false,
      firstTry: false,
      attempts: 2,
    });
  });

  it("NEXT only after a finished question, then completes after the last", () => {
    expect(run(plain, [{ type: "NEXT" }]).index).toBe(0);
    const answerAll = plain.flatMap((): PlayerAction[] => [
      { type: "SUBMIT" },
      { type: "GRADED", result: ok },
      { type: "NEXT" },
    ]);
    const s = run(plain, answerAll);
    expect(s.phase).toBe("complete");
    expect(s.results).toHaveLength(plain.length);
  });

  it("grading failure returns to answering with a gentle message", () => {
    const s = run(plain, [{ type: "SUBMIT" }, { type: "GRADE_FAILED" }]);
    expect(s.phase).toBe("answering");
    expect(s.error).toBeDefined();
  });

  it("hints add eliminated options", () => {
    const s = run(plain, [
      { type: "HINT", text: "Gợi ý", eliminateOptionId: "b" },
    ]);
    expect(s).toMatchObject({
      hint: "Gợi ý",
      hintUsed: true,
      eliminated: ["b"],
    });
  });

  it("resumes at a saved question with earlier results", () => {
    const saved = [
      { questionId: plain[0]!.id, correct: true, firstTry: true, attempts: 1 },
    ];
    const s = initPlayer(plain, { index: 1, results: saved });
    expect(s).toMatchObject({ index: 1, phase: "answering", results: saved });
  });
});

describe("resume keeps the try count", () => {
  it("restores attempt 2 after a refresh", () => {
    const s = initPlayer(plain, { index: 0, results: [], attempt: 2 });
    expect(s.attempt).toBe(2);
    const r = createPlayerReducer(plain);
    const after = [
      { type: "SUBMIT" },
      {
        type: "GRADED",
        result: { correct: true, final: true, message: "Đúng" },
      },
    ].reduce((st, a) => r(st, a as PlayerAction), s);
    expect(after.results[0]).toMatchObject({
      correct: true,
      firstTry: false,
      attempts: 2,
    });
  });
});
