import { describe, expect, it } from "vitest";

import { demoContentRepository as contentRepository } from "@/data/demo/repository";

import {
  buildDailyPlan,
  dateKeyIn,
  greeting,
  hourIn,
  type LessonState,
  starsOnDay,
  totalStars,
} from "./calc";
import { type ChildProgress, emptyProgress } from "./model";

const catalog = contentRepository.getCatalog();
const ids = contentRepository.listLessonIds();

/** Lesson states as the database reports them for a new child. */
function freshStates(): Record<string, LessonState> {
  const s: Record<string, LessonState> = {};
  for (const w of catalog.worlds)
    for (const skill of w.skills)
      skill.lessons.forEach((l, i) => {
        s[l.id] = w.unlock || i > 0 ? "locked" : "available";
      });
  return s;
}

describe("time zone helpers (Asia/Ho_Chi_Minh)", () => {
  it("uses Vietnam's calendar day, not the server's", () => {
    // 20:30 UTC on the 21st is 03:30 on the 22nd in Vietnam (UTC+7).
    const d = new Date("2026-11-21T20:30:00Z");
    expect(dateKeyIn(d)).toBe("2026-11-22");
    expect(hourIn(d)).toBe(3);
  });

  it("counts today's stars by the local day", () => {
    const p: ChildProgress = {
      ...emptyProgress(),
      history: [
        {
          type: "lesson",
          lessonId: "af-l1",
          stars: 3,
          at: "2026-11-21T18:00:00Z",
        }, // 22nd VN
        {
          type: "lesson",
          lessonId: "af-l2",
          stars: 2,
          at: "2026-11-21T10:00:00Z",
        }, // 21st VN
        {
          type: "badge",
          rewardId: "explorer-star",
          at: "2026-11-21T18:00:00Z",
        },
      ],
    };
    expect(starsOnDay(p, "2026-11-22")).toBe(3);
    expect(starsOnDay(p, "2026-11-21")).toBe(2);
  });

  it("totals the best stars per lesson", () => {
    const p = emptyProgress();
    p.lessons["af-l1"] = {
      lessonId: "af-l1",
      worldId: "alphabet-forest",
      firstCompletedAt: "",
      lastCompletedAt: "",
      bestStars: 3,
      plays: 2,
      last: { stars: 1, total: 3, correct: 1, firstTry: 0, newRewards: [] },
    };
    expect(totalStars(p)).toBe(3);
  });
});

describe("daily plan", () => {
  it("suggests 3 open lessons from different worlds", () => {
    const plan = buildDailyPlan(catalog, freshStates(), "2026-11-22");
    expect(plan).toHaveLength(3);
    const worlds = plan.map((id) => contentRepository.getLesson(id)!.worldId);
    expect(new Set(worlds).size).toBe(3);
    expect(plan.every((id) => freshStates()[id] === "available")).toBe(true);
  });

  it("changes the mix by day and never suggests locked lessons", () => {
    const a = buildDailyPlan(catalog, freshStates(), "2026-11-22");
    const b = buildDailyPlan(catalog, freshStates(), "2026-11-23");
    expect(a).not.toEqual(b);
    expect(b.some((id) => id.startsWith("ca-"))).toBe(false);
  });

  it("falls back to review when everything is done", () => {
    const done = Object.fromEntries(
      ids.map((id) => [id, "completed" as const]),
    );
    expect(buildDailyPlan(catalog, done, "2026-11-22")).toHaveLength(3);
  });
});

describe("greeting", () => {
  it.each([
    [7, "Chào buổi sáng"],
    [12, "Chào buổi trưa"],
    [16, "Chào buổi chiều"],
    [20, "Chào buổi tối"],
  ])("%i h → %s", (h, text) => expect(greeting(h)).toBe(text));
});
