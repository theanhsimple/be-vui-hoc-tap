import {
  IDLE_RESET_MS,
  isActivityRoute,
  isBreakDue,
  parseStint,
  touchStint,
} from "./break-timer";

describe("break reminder timer", () => {
  const t0 = 1_800_000_000_000;

  it("starts, continues and resets stints", () => {
    const s = touchStint(null, "a", t0);
    expect(s).toEqual({ childId: "a", startedAt: t0, lastSeenAt: t0 });
    expect(touchStint(s, "a", t0 + 60_000).startedAt).toBe(t0);
    expect(touchStint(s, "b", t0 + 60_000).startedAt).toBe(t0 + 60_000);
    expect(touchStint(s, "a", t0 + IDLE_RESET_MS + 1).startedAt).toBe(
      t0 + IDLE_RESET_MS + 1,
    );
  });

  it("is due only after the parent's limit", () => {
    const s = touchStint(null, "a", t0);
    expect(isBreakDue(s, 15, t0 + 14 * 60_000)).toBe(false);
    expect(isBreakDue(s, 15, t0 + 15 * 60_000)).toBe(true);
    expect(isBreakDue(s, null, t0 + 600 * 60_000)).toBe(false);
  });

  it("ignores malformed storage", () => {
    expect(parseStint("{bad")).toBeNull();
    expect(parseStint(JSON.stringify({ childId: 1 }))).toBeNull();
    expect(parseStint(null)).toBeNull();
  });

  it("waits during lessons and the placement activity", () => {
    expect(isActivityRoute("/student/lessons/af-l1/play")).toBe(true);
    expect(isActivityRoute("/student/discover/first-discovery")).toBe(true);
    expect(isActivityRoute("/student/lessons/af-l1/result")).toBe(false);
    expect(isActivityRoute("/student/home")).toBe(false);
  });
});
