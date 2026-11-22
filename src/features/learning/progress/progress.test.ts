import { describe, expect, it } from "vitest";

import { contentRepository } from "../content/repository";
import {
  buildDailyPlan,
  completedCount,
  lessonState,
  recordLessonCompletion,
  starsFor,
  totalStars,
  worldState,
} from "./calc";
import {
  type ChildProgress,
  emptyProgress,
  type QuestionResult,
} from "./model";

const catalog = contentRepository.getCatalog();
const world = (id: string) => catalog.worlds.find((w) => w.id === id)!;
const lesson = (id: string) => contentRepository.getLesson(id)!;
const results = (
  pattern: Array<"first" | "retry" | "missed">,
): QuestionResult[] =>
  pattern.map((p, i) => ({
    questionId: `q${i}`,
    correct: p !== "missed",
    firstTry: p === "first",
    attempts: p === "first" ? 1 : 2,
  }));

function complete(
  p: ChildProgress,
  lessonId: string,
  r = results(["first", "first", "first"]),
  at = new Date("2026-11-22T09:00:00Z"),
) {
  return recordLessonCompletion(catalog, p, lesson(lessonId), r, at);
}

describe("stars (effort-based)", () => {
  it.each([
    [["first", "first", "first"], 3],
    [["first", "first", "retry"], 2],
    [["first", "missed", "missed"], 1],
    [["missed", "missed", "missed"], 1],
  ] as const)("%j → %i stars", (pattern, stars) => {
    expect(starsFor(results([...pattern]))).toBe(stars);
  });
});

describe("progression rules", () => {
  it("first lesson of each skill is open; the next opens after the previous", () => {
    const af = world("alphabet-forest");
    let p = emptyProgress();
    expect(lessonState(af, "af-l1", p)).toBe("available");
    expect(lessonState(af, "af-l2", p)).toBe("locked");
    expect(lessonState(af, "af-l3", p)).toBe("available");
    p = complete(p, "af-l1").progress;
    expect(lessonState(af, "af-l1", p)).toBe("completed");
    expect(lessonState(af, "af-l2", p)).toBe("available");
  });

  it("Challenge Arena opens after 3 completed lessons anywhere", () => {
    const ca = world("challenge-arena");
    let p = emptyProgress();
    for (const id of ["af-l1", "nk-l1"]) p = complete(p, id).progress;
    expect(worldState(ca, p)).toBe("locked");
    expect(lessonState(ca, "ca-l1", p)).toBe("locked");
    p = complete(p, "iq-l1").progress;
    expect(worldState(ca, p)).toBe("available");
  });

  it("a world is completed when all its lessons are", () => {
    let p = emptyProgress();
    for (const id of ["ei-l1", "ei-l2", "ei-l3", "ei-l4"])
      p = complete(p, id).progress;
    expect(worldState(world("english-island"), p)).toBe("completed");
  });
});

describe("recordLessonCompletion", () => {
  it("keeps the best stars, counts plays, clears the in-progress session", () => {
    let p: ChildProgress = {
      ...emptyProgress(),
      inProgress: {
        lessonId: "af-l1",
        questionIndex: 2,
        results: [],
        startedAt: "x",
      },
    };
    p = complete(p, "af-l1", results(["first", "first", "first"])).progress;
    expect(p.inProgress).toBeUndefined();
    p = complete(p, "af-l1", results(["missed", "missed", "missed"])).progress;
    expect(p.lessons["af-l1"]!.bestStars).toBe(3);
    expect(p.lessons["af-l1"]!.last.stars).toBe(1);
    expect(p.lessons["af-l1"]!.plays).toBe(2);
    expect(totalStars(p)).toBe(3);
  });

  it("awards badges once, based on effort", () => {
    let o = complete(emptyProgress(), "af-l1");
    expect(o.newRewards).toEqual(["explorer-star"]);
    o = complete(o.progress, "af-l3");
    expect(o.newRewards).toEqual(["little-reader"]);
    o = complete(o.progress, "nk-l1");
    expect(o.newRewards).toEqual([]);
    o = complete(o.progress, "mg-l1");
    expect(o.newRewards).toEqual(["curious-mind"]);
    expect(o.progress.rewards.map((r) => r.id).sort()).toEqual([
      "curious-mind",
      "explorer-star",
      "little-reader",
    ]);
    o = complete(o.progress, "af-l1");
    expect(o.newRewards).toEqual([]);
    expect(o.progress.history.filter((e) => e.type === "badge")).toHaveLength(
      3,
    );
  });

  it("Brave Challenger after a Challenge Arena lesson", () => {
    let p = emptyProgress();
    for (const id of ["af-l1", "nk-l1", "iq-l1"]) p = complete(p, id).progress;
    expect(complete(p, "ca-l1").newRewards).toContain("brave-challenger");
  });
});

describe("daily plan", () => {
  it("suggests 3 open lessons from different worlds", () => {
    const plan = buildDailyPlan(catalog, emptyProgress(), "2026-11-22");
    expect(plan).toHaveLength(3);
    const worlds = plan.map((id) => lesson(id).worldId);
    expect(new Set(worlds).size).toBe(3);
    expect(worlds).not.toContain("challenge-arena");
  });

  it("changes the mix by day and skips completed lessons", () => {
    expect(buildDailyPlan(catalog, emptyProgress(), "2026-11-23")).not.toEqual(
      buildDailyPlan(catalog, emptyProgress(), "2026-11-22"),
    );
    let p = emptyProgress();
    const first = buildDailyPlan(catalog, p, "2026-11-22");
    p = complete(p, first[0]!).progress;
    expect(buildDailyPlan(catalog, p, "2026-11-22")).not.toContain(first[0]);
  });

  it("falls back to review when everything is done", () => {
    let p = emptyProgress();
    for (const id of contentRepository.listLessonIds())
      p = complete(p, id).progress;
    expect(completedCount(p)).toBe(28);
    expect(buildDailyPlan(catalog, p, "2026-11-22")).toHaveLength(3);
  });
});
