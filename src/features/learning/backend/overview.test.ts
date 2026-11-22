import { demoContentRepository } from "@/data/demo/repository";

import { overviewSchema, toChildProgress } from "./overview";

const catalog = demoContentRepository.getCatalog();
const T = "2026-11-22T09:00:00.000000+00:00";

const raw = {
  child: {
    id: "6f1f8a51-1d1c-4a43-9b8d-5d2a0b6c1e11",
    nickname: "Mầm",
    avatarKey: "sun",
    rewardsSeenAt: null,
  },
  modules: [
    { id: "alphabet-forest", state: "available", completed: 1, total: 4 },
  ],
  lessons: [
    {
      id: "af-l1",
      state: "completed",
      record: {
        bestStars: 3,
        plays: 2,
        firstCompletedAt: T,
        lastCompletedAt: T,
        last: {
          stars: 2,
          total: 3,
          correct: 3,
          firstTry: 2,
          newRewards: ["explorer-star", "future-badge"],
        },
      },
    },
    { id: "af-l2", state: "available", record: null },
  ],
  rewards: [
    { id: "explorer-star", earnedAt: T, reason: "x" },
    { id: "future-badge", earnedAt: T, reason: "y" },
  ],
  history: [
    { type: "lesson", lessonId: "af-l1", stars: 2, at: T },
    { type: "badge", rewardId: "future-badge", at: T },
  ],
  inProgress: {
    sessionId: "0b0f7f3e-6a0b-4e8e-8a51-3a7c2b1d4e55",
    lessonId: "af-l2",
    status: "in_progress",
    currentIndex: 1,
    total: 3,
    startedAt: T,
    attempt: 2,
    results: [
      { questionId: "af-l2-q1", correct: true, firstTry: true, attempts: 1 },
    ],
  },
  mastery: [
    {
      skillId: "af-s1",
      state: "learning",
      accuracy: 1,
      evidence: 3,
      lastPracticedAt: T,
    },
  ],
};

describe("student overview mapping", () => {
  it("maps the RPC payload to the progress view model", () => {
    const p = toChildProgress(overviewSchema.parse(raw), catalog);
    expect(p.lessons["af-l1"]).toMatchObject({
      worldId: "alphabet-forest",
      bestStars: 3,
      plays: 2,
      last: { stars: 2, newRewards: ["explorer-star"] },
    });
    expect(p.lessons["af-l2"]).toBeUndefined();
    expect(p.inProgress).toMatchObject({
      lessonId: "af-l2",
      questionIndex: 1,
      attempt: 2,
    });
  });

  it("drops rewards the app does not know yet instead of failing", () => {
    const p = toChildProgress(overviewSchema.parse(raw), catalog);
    expect(p.rewards.map((r) => r.id)).toEqual(["explorer-star"]);
    expect(p.history).toHaveLength(1);
  });

  it("rejects malformed payloads", () => {
    expect(() =>
      overviewSchema.parse({ ...raw, lessons: [{ id: "x", state: "open" }] }),
    ).toThrow();
    expect(() =>
      overviewSchema.parse({
        ...raw,
        child: { ...raw.child, id: "not-a-uuid" },
      }),
    ).toThrow();
  });
});
