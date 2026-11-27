// @vitest-environment node
import { describe, expect, it } from "vitest";

import { DEMO_ANSWER_KEYS } from "@/data/demo/answer-keys";
import { PLACEMENT_ASSESSMENT } from "@/data/demo/parent-guides";

import { correctResponse, LESSONS, wrongResponse } from "../../test/db/helpers";
import { deviceContent } from "./content";
import * as E from "./engine";
import { deviceStateSchema, emptyState, type DeviceState } from "./state";

const c = deviceContent();
let t = Date.parse("2026-11-27T02:00:00Z");
const now = () => new Date((t += 20_000));
const prefs = { voice: true, sounds: true, sessionMinutes: 20 as const };

function withChild(name = "Bé") {
  const r = E.createChild(
    emptyState(now().toISOString()),
    {
      nickname: name,
      avatarKey: "sun",
      birthYear: null,
      preferences: prefs,
    },
    now(),
  );
  return { state: r.state, child: r.childId };
}

function play(s: DeviceState, child: string, lessonId: string, right = true) {
  let state = E.startSession(s, c, child, lessonId, false, now()).state;
  const sessionId = E.activeSession(state, c, child, lessonId)!.sessionId;
  for (const q of c.lesson(lessonId)!.questions) {
    for (;;) {
      const r = E.submitAttempt(
        state,
        c,
        child,
        sessionId,
        q.id,
        right ? correctResponse(q) : wrongResponse(q),
        now(),
      );
      state = r.state;
      if (!r.outcome.canRetry) break;
    }
  }
  return { state, sessionId };
}

describe("device engine — grading (same rules as PostgreSQL)", () => {
  it("grades all 84 questions correct with the key and wrong otherwise", () => {
    const qs = LESSONS.flatMap((l) => l.questions);
    expect(qs).toHaveLength(84);
    for (const q of qs) {
      const key = DEMO_ANSWER_KEYS[q.id]!;
      const ok = E.gradeResponse(q, key, correctResponse(q));
      expect(ok.valid && ok.score === ok.maxScore, q.id).toBe(true);
      const bad = E.gradeResponse(q, key, wrongResponse(q));
      expect(bad.valid && bad.score < bad.maxScore, q.id).toBe(true);
    }
  });

  it("rejects malformed or foreign responses", () => {
    const q = c.lesson("nk-l3")!.questions[0]!;
    const key = DEMO_ANSWER_KEYS[q.id]!;
    for (const r of [
      null,
      {},
      { type: "ordering", order: [] },
      { type: q.type, optionId: "zzz" },
      { type: q.type, optionId: 3 },
    ])
      expect(E.gradeResponse(q, key, r).valid).toBe(false);
  });
});

describe("device engine — lessons, stars, rewards, unlocking", () => {
  it("plays a lesson: 3 stars, first badge, next lesson opens; arena stays locked", () => {
    const { state: s0, child } = withChild();
    expect(E.lessonStates(s0, c, child)["af-l2"]).toBe("locked");
    expect(() => E.startSession(s0, c, child, "af-l2", false, now())).toThrow(
      "lesson_locked",
    );
    const { state, sessionId } = play(s0, child, "af-l1");
    expect(E.sessionResult(state, child, sessionId)).toMatchObject({
      status: "completed",
      stars: 3,
      newRewards: ["explorer-star"],
    });
    const states = E.lessonStates(state, c, child);
    expect(states["af-l1"]).toBe("completed");
    expect(states["af-l2"]).toBe("available");
    const ov = E.overview(state, c, child);
    expect(ov.modules.find((m) => m.id === "challenge-arena")?.state).toBe(
      "locked",
    );
    expect(ov.rewards.map((r) => r.id)).toEqual(["explorer-star"]);
    // replaying never grants a badge twice
    const again = play(state, child, "af-l1").state;
    expect(
      again.rewards.filter((r) => r.rewardId === "explorer-star"),
    ).toHaveLength(1);
  });

  it("try again, then reveal after the last try; skipping ahead is refused", () => {
    const { state: s0, child } = withChild();
    const { state, session } = E.startSession(
      s0,
      c,
      child,
      "nk-l3",
      false,
      now(),
    );
    const q = c.lesson("nk-l3")!.questions;
    expect(() =>
      E.submitAttempt(
        state,
        c,
        child,
        session.sessionId,
        q[1]!.id,
        correctResponse(q[1]!),
        now(),
      ),
    ).toThrow("question_mismatch");
    const a = E.submitAttempt(
      state,
      c,
      child,
      session.sessionId,
      q[0]!.id,
      wrongResponse(q[0]!),
      now(),
    );
    expect(a.outcome).toMatchObject({
      isCorrect: false,
      canRetry: true,
      nextAction: "retry",
      reveal: null,
    });
    expect(E.activeSession(a.state, c, child, "nk-l3")).toMatchObject({
      currentIndex: 0,
      attempt: 2,
    });
    const b = E.submitAttempt(
      a.state,
      c,
      child,
      session.sessionId,
      q[0]!.id,
      wrongResponse(q[0]!),
      now(),
    );
    expect(b.outcome).toMatchObject({
      isCorrect: false,
      canRetry: false,
      nextAction: "continue",
    });
    expect(b.outcome.reveal).toMatchObject({ type: "choice" });
    const h = E.requestHint(b.state, c, child, session.sessionId, q[1]!.id);
    expect(h.text.length).toBeGreaterThan(0);
  });

  it("stars follow D-032", () => {
    expect([
      E.starsFor(3, 3),
      E.starsFor(2, 3),
      E.starsFor(1, 3),
      E.starsFor(0, 3),
    ]).toEqual([3, 2, 1, 1]);
    const { state: s0, child } = withChild();
    const { state, sessionId } = play(s0, child, "af-l1", false);
    expect(E.sessionResult(state, child, sessionId)?.stars).toBe(1);
  });

  it("restart abandons the open session; archive abandons and hides it", () => {
    const { state: s0, child } = withChild();
    const first = E.startSession(s0, c, child, "af-l1", false, now());
    const second = E.startSession(first.state, c, child, "af-l1", true, now());
    expect(second.session.sessionId).not.toBe(first.session.sessionId);
    const archived = E.archiveChild(second.state, child, now());
    expect(archived.sessions.every((x) => x.status !== "in_progress")).toBe(
      true,
    );
    expect(() =>
      E.startSession(archived, c, child, "af-l1", false, now()),
    ).toThrow("child_archived");
  });
});

describe("device engine — mastery (D-042)", () => {
  it("one lesson is not mastery; repeated success over sessions is; then review", () => {
    const w = withChild();
    const child = w.child;
    let state = w.state;
    state = play(state, child, "af-l1").state;
    expect(state.mastery.find((m) => m.skillId === "af-s1")?.state).toBe(
      "learning",
    );
    state = play(state, child, "af-l2").state;
    state = play(state, child, "af-l1").state;
    state = play(state, child, "af-l2").state;
    const m = state.mastery.find((x) => x.skillId === "af-s1")!;
    expect(m.evidence).toBeGreaterThanOrEqual(10);
    expect(m.state).toBe("mastered");
    for (let i = 0; i < 4; i++)
      state = play(state, child, "af-l1", false).state;
    expect(state.mastery.find((x) => x.skillId === "af-s1")?.state).toBe(
      "review",
    );
  });
});

describe("device engine — placement, report, children", () => {
  it("records placement without changing stars and summarises per world", () => {
    const w = withChild();
    const child = w.child;
    let state = w.state;
    const run = E.startPlacement(state, c, child, false, now());
    state = run.state;
    PLACEMENT_ASSESSMENT.questionSlugs.forEach((slug, i) => {
      const q = c.info(slug)!.question;
      state = E.submitPlacement(
        state,
        c,
        child,
        run.run.runId,
        slug,
        i < 4 ? correctResponse(q) : wrongResponse(q),
        now(),
      ).state;
    });
    const summary = E.placementSummary(state, c, child)!;
    expect(
      Object.fromEntries(summary.modules.map((m) => [m.moduleId, m.band])),
    ).toEqual({
      "alphabet-forest": "confident",
      "number-kingdom": "confident",
      "iq-castle": "exploring",
      "memory-garden": "exploring",
      "school-town": "exploring",
    });
    expect(state.mastery).toHaveLength(0);
    expect(E.childReport(state, c, child, now()).totals.stars).toBe(0);
  });

  it("reports lessons, time and recent activity", () => {
    const w = withChild();
    const child = w.child;
    let state = w.state;
    state = play(state, child, "nk-l3").state;
    const r = E.childReport(state, c, child, now());
    expect(r.totals).toMatchObject({
      sessionsCompleted: 1,
      lessonsCompleted: 1,
      activeDays7: 1,
    });
    expect(r.totals.activeSeconds).toBeGreaterThan(0);
    expect(r.last7).toHaveLength(7);
    expect(r.skills).toHaveLength(14);
    expect(r.recent[0]).toMatchObject({ lessonId: "nk-l3" });
  });

  it("limits active children, deletes only archived children with the nickname", () => {
    let { state } = withChild("A");
    for (let i = 0; i < 5; i++)
      state = E.createChild(
        state,
        {
          nickname: `B${i}`,
          avatarKey: "sun",
          birthYear: null,
          preferences: prefs,
        },
        now(),
      ).state;
    expect(() =>
      E.createChild(
        state,
        {
          nickname: "X",
          avatarKey: "sun",
          birthYear: null,
          preferences: prefs,
        },
        now(),
      ),
    ).toThrow("child_limit");
    const id = state.children[0]!.id;
    state = play(state, id, "af-l1").state;
    expect(() => E.deleteChild(state, id, "A")).toThrow("child_not_archived");
    state = E.archiveChild(state, id, now());
    expect(() => E.deleteChild(state, id, "a")).toThrow(
      "confirmation_mismatch",
    );
    state = E.deleteChild(state, id, "A");
    for (const k of [
      "sessions",
      "attempts",
      "progress",
      "mastery",
      "rewards",
    ] as const)
      expect(state[k].filter((x) => x.childId === id)).toHaveLength(0);
    expect(deviceStateSchema.safeParse(state).success).toBe(true);
  });
});
