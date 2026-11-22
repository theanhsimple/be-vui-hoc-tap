import { beforeEach, describe, expect, it } from "vitest";

import { DEMO_CHILDREN, STORAGE_KEY, demoStore, parseState } from "./demoStore";

describe("demo store", () => {
  beforeEach(() => {
    localStorage.clear();
    demoStore._resetForTests();
  });

  it("seeds the demo family and falls back on corrupt data", () => {
    expect(parseState(null).children).toHaveLength(DEMO_CHILDREN.length);
    expect(parseState("{not json").selectedChildId).toBeNull();
    expect(parseState(JSON.stringify({ version: 2 })).children).toHaveLength(
      DEMO_CHILDREN.length,
    );
  });

  it("only selects children of this family", () => {
    demoStore.selectChild("someone-else");
    expect(demoStore.getSnapshot().selectedChildId).toBeNull();
    demoStore.selectChild("demo-bong");
    expect(demoStore.getSnapshot().selectedChildId).toBe("demo-bong");
  });

  it("persists progress per child and survives a reload", () => {
    demoStore.updateProgress("demo-mam", (p) => ({
      ...p,
      dailyPlan: { date: "2026-11-22", lessonIds: ["af-l1"] },
    }));
    demoStore._resetForTests();
    const reloaded = demoStore.getSnapshot();
    expect(reloaded.progress["demo-mam"]?.dailyPlan?.lessonIds).toEqual([
      "af-l1",
    ]);
    expect(reloaded.progress["demo-bong"]).toBeUndefined();
    expect(localStorage.getItem(STORAGE_KEY)).toContain("demo-mam");
  });

  it("notifies subscribers and resets", () => {
    let calls = 0;
    const unsub = demoStore.subscribe(() => calls++);
    demoStore.selectChild("demo-tom");
    demoStore.reset();
    unsub();
    expect(calls).toBe(2);
    expect(demoStore.getSnapshot().selectedChildId).toBeNull();
  });
});
