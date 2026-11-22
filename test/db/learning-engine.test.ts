import { randomUUID } from "node:crypto";

import {
  bootstrapStaffRole,
  correctResponse,
  createChild,
  createFamily,
  createUser,
  LESSONS,
  lesson,
  playLesson,
  playLessonWrong,
  rpc,
  rpcError,
  startSession,
  submit,
  type TestUser,
  wrongResponse,
} from "./helpers";

let parent: TestUser;

/** Each test gets its own family (families are limited to 6 active children). */
async function newChild(name: string) {
  parent = await createUser("engine");
  const family = await createFamily(parent, "Engine family");
  return createChild(parent, family, name);
}

interface Overview {
  lessons: Array<{
    id: string;
    state: string;
    record: null | { bestStars: number; plays: number };
  }>;
  modules: Array<{
    id: string;
    state: string;
    completed: number;
    total: number;
  }>;
  rewards: Array<{ id: string }>;
  mastery: Array<{
    skillId: string;
    state: string;
    evidence: number;
    accuracy: number;
  }>;
  inProgress: null | {
    lessonId: string;
    currentIndex: number;
    attempt: number;
  };
}
const overview = (childId: string) =>
  rpc<Overview>(parent.client, "get_student_overview", { p_child_id: childId });

describe("server-side grading", () => {
  it("grades all 84 demo questions correct when answered with the key (all six types)", async () => {
    const child = await newChild("Tất cả");
    // Order satisfies the progression rules: worlds in order, arena last.
    const order = [
      ...LESSONS.filter((l) => l.worldId !== "challenge-arena"),
      ...LESSONS.filter((l) => l.worldId === "challenge-arena"),
    ];
    const types = new Set<string>();
    let graded = 0;
    for (const l of order) {
      const { results, sessionId } = await playLesson(parent, child, l.id);
      results.forEach((r, i) => {
        expect(r.isCorrect, l.questions[i]!.id).toBe(true);
        expect(r.score).toBe(r.maxScore);
        expect(r.reveal).toBeNull();
      });
      expect(results.at(-1)!.nextAction).toBe("complete");
      const result = await rpc<{ status: string; stars: number }>(
        parent.client,
        "get_session_result",
        { p_session_id: sessionId },
      );
      expect(result).toMatchObject({ status: "completed", stars: 3 });
      l.questions.forEach((q) => types.add(q.type));
      graded += results.length;
    }
    expect(graded).toBe(84);
    expect([...types].sort()).toEqual([
      "image_choice",
      "matching",
      "memory",
      "ordering",
      "pattern",
      "single_choice",
    ]);
    const o = await overview(child);
    expect(o.lessons.every((x) => x.state === "completed")).toBe(true);
    expect(o.rewards.map((r) => r.id).sort()).toEqual([
      "brave-challenger",
      "curious-mind",
      "explorer-star",
      "little-reader",
      "memory-master",
      "number-finder",
    ]);
  });

  it("wrong answers: retry first, reveal only when the question closes", async () => {
    const child = await newChild("Sai");
    const s = await startSession(parent, child, "af-l1");
    const q = lesson("af-l1").questions[0]!;
    const first = await submit(parent, s.sessionId, q.id, wrongResponse(q));
    expect(first).toMatchObject({
      isCorrect: false,
      canRetry: true,
      nextAction: "retry",
      attemptNo: 1,
      reveal: null,
    });
    const second = await submit(parent, s.sessionId, q.id, wrongResponse(q));
    expect(second).toMatchObject({
      isCorrect: false,
      canRetry: false,
      nextAction: "continue",
      attemptNo: 2,
    });
    expect(second.reveal).toMatchObject({ type: "choice" });
    // The closed question cannot be answered again.
    const again = await rpcError(parent.client, "submit_attempt", {
      p_session_id: s.sessionId,
      p_question_slug: q.id,
      p_response: correctResponse(q),
      p_idempotency_key: randomUUID(),
    });
    expect(again.message).toBe("question_mismatch");
  });

  it("partial credit is reported but only a full answer is correct", async () => {
    const child = await newChild("Một phần");
    const l = lesson("af-l1");
    const s = await startSession(parent, child, "af-l1");
    await submit(
      parent,
      s.sessionId,
      l.questions[0]!.id,
      correctResponse(l.questions[0]!),
    );
    await submit(
      parent,
      s.sessionId,
      l.questions[1]!.id,
      correctResponse(l.questions[1]!),
    );
    const m = l.questions[2]!; // matching, 3 pairs
    expect(m.type).toBe("matching");
    const good = correctResponse(m).pairs as string[][];
    const swapped = [
      good[0],
      [good[1]![0], good[2]![1]],
      [good[2]![0], good[1]![1]],
    ];
    const r = await submit(parent, s.sessionId, m.id, {
      type: "matching",
      pairs: swapped,
    });
    expect(r).toMatchObject({
      isCorrect: false,
      score: 1,
      maxScore: 3,
      canRetry: true,
    });
  });

  it("rejects malformed, foreign or out-of-order responses", async () => {
    const child = await newChild("Lạ");
    const s = await startSession(parent, child, "af-l1");
    const [q1, q2] = lesson("af-l1").questions;
    for (const response of [
      { type: q1!.type, optionId: "zz" }, // unknown option
      { type: "ordering", order: ["a"] }, // wrong type
      { type: q1!.type }, // missing field
      "not-an-object",
    ]) {
      const err = await rpcError(parent.client, "submit_attempt", {
        p_session_id: s.sessionId,
        p_question_slug: q1!.id,
        p_response: response,
        p_idempotency_key: randomUUID(),
      });
      expect(err.message).toBe("invalid_response");
    }
    // Skipping ahead to question 2 is refused.
    const skip = await rpcError(parent.client, "submit_attempt", {
      p_session_id: s.sessionId,
      p_question_slug: q2!.id,
      p_response: correctResponse(q2!),
      p_idempotency_key: randomUUID(),
    });
    expect(skip.message).toBe("question_mismatch");
    // Memory: a client claiming success with fake pairs is not trusted.
    const mem = lesson("mg-l1").questions[0]!;
    const ms = await startSession(parent, child, "mg-l1");
    const r = await submit(parent, ms.sessionId, mem.id, wrongResponse(mem));
    expect(r.isCorrect).toBe(false);
  });

  it("hints never reveal the answer", async () => {
    const child = await newChild("Gợi ý");
    const s = await startSession(parent, child, "af-l1");
    const q = lesson("af-l1").questions[0]!;
    const hint = await rpc<{ text: string; eliminateOptionId: string | null }>(
      parent.client,
      "request_hint",
      { p_session_id: s.sessionId, p_question_slug: q.id },
    );
    expect(hint.text.length).toBeGreaterThan(0);
    expect(hint.eliminateOptionId).not.toBe(correctResponse(q).optionId);
  });
});

describe("progression is enforced by the server", () => {
  it("locked lessons and worlds cannot be started", async () => {
    const child = await newChild("Khóa");
    expect(
      (
        await rpcError(parent.client, "start_session", {
          p_child_id: child,
          p_lesson_slug: "af-l2",
        })
      ).message,
    ).toBe("lesson_locked");
    expect(
      (
        await rpcError(parent.client, "start_session", {
          p_child_id: child,
          p_lesson_slug: "ca-l1",
        })
      ).message,
    ).toBe("lesson_locked");
    expect(
      (
        await rpcError(parent.client, "start_session", {
          p_child_id: child,
          p_lesson_slug: "nope",
        })
      ).message,
    ).toBe("lesson_not_found");
    await playLesson(parent, child, "af-l1");
    await startSession(parent, child, "af-l2"); // now open
    await playLesson(parent, child, "nk-l1");
    await playLesson(parent, child, "iq-l1");
    const o = await overview(child);
    expect(o.modules.find((m) => m.id === "challenge-arena")?.state).toBe(
      "available",
    );
  });
});

describe("sessions", () => {
  it("start is idempotent (resume) and restart abandons the old session", async () => {
    const child = await newChild("Phiên");
    const a = await startSession(parent, child, "nk-l1");
    const b = await startSession(parent, child, "nk-l1");
    expect(b.sessionId).toBe(a.sessionId);
    expect(b.resumed).toBe(true);
    const q = lesson("nk-l1").questions[0]!;
    await submit(parent, a.sessionId, q.id, wrongResponse(q));
    const o = await overview(child);
    expect(o.inProgress).toMatchObject({
      lessonId: "nk-l1",
      currentIndex: 0,
      attempt: 2,
    });
    const c = await startSession(parent, child, "nk-l1", true);
    expect(c.sessionId).not.toBe(a.sessionId);
    const old = await rpc<{ status: string }>(
      parent.client,
      "get_session_state",
      {
        p_session_id: a.sessionId,
      },
    );
    expect(old.status).toBe("abandoned");
    // attempts on the abandoned session are kept
    const { data } = await parent.client
      .from("question_attempts")
      .select("id")
      .eq("session_id", a.sessionId);
    expect(data?.length).toBe(1);
  });

  it("concurrent starts create one session", async () => {
    const child = await newChild("Đồng thời");
    const all = await Promise.all(
      Array.from({ length: 5 }, () => startSession(parent, child, "iq-l1")),
    );
    expect(new Set(all.map((s) => s.sessionId)).size).toBe(1);
  });

  it("abandon keeps attempts and blocks further answers", async () => {
    const child = await newChild("Bỏ dở");
    const s = await startSession(parent, child, "st-l1");
    const q = lesson("st-l1").questions[0]!;
    await submit(parent, s.sessionId, q.id, correctResponse(q));
    await rpc(parent.client, "abandon_session", { p_session_id: s.sessionId });
    await rpc(parent.client, "abandon_session", { p_session_id: s.sessionId });
    const q2 = lesson("st-l1").questions[1]!;
    const err = await rpcError(parent.client, "submit_attempt", {
      p_session_id: s.sessionId,
      p_question_slug: q2.id,
      p_response: correctResponse(q2),
      p_idempotency_key: randomUUID(),
    });
    expect(err.message).toBe("session_not_active");
  });
});

describe("11. duplicate submissions", () => {
  it("the same idempotency key returns the stored result and changes nothing", async () => {
    const child = await newChild("Lặp");
    const s = await startSession(parent, child, "af-l1");
    const q = lesson("af-l1").questions[0]!;
    const key = randomUUID();
    const first = await submit(
      parent,
      s.sessionId,
      q.id,
      correctResponse(q),
      key,
    );
    const again = await submit(
      parent,
      s.sessionId,
      q.id,
      correctResponse(q),
      key,
    );
    expect(again.attemptId).toBe(first.attemptId);
    expect(again.replayed).toBe(true);
    const { data } = await parent.client
      .from("question_attempts")
      .select("id")
      .eq("session_id", s.sessionId);
    expect(data?.length).toBe(1);
    const state = await rpc<{ currentIndex: number }>(
      parent.client,
      "get_session_state",
      {
        p_session_id: s.sessionId,
      },
    );
    expect(state.currentIndex).toBe(1);
  });

  it("concurrent duplicates create one attempt and advance once", async () => {
    const child = await newChild("Song song");
    const s = await startSession(parent, child, "af-l1");
    const q = lesson("af-l1").questions[0]!;
    const key = randomUUID();
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        submit(parent, s.sessionId, q.id, correctResponse(q), key),
      ),
    );
    const ok = results.filter((r) => r.status === "fulfilled");
    expect(ok.length).toBe(6);
    const { data } = await parent.client
      .from("question_attempts")
      .select("id")
      .eq("session_id", s.sessionId);
    expect(data?.length).toBe(1);
    const state = await rpc<{ currentIndex: number }>(
      parent.client,
      "get_session_state",
      {
        p_session_id: s.sessionId,
      },
    );
    expect(state.currentIndex).toBe(1);
  });
});

describe("12. rewards", () => {
  it("are granted once, with a reason, however often completion is requested", async () => {
    const child = await newChild("Thưởng");
    const first = await playLesson(parent, child, "af-l1");
    await Promise.all(
      Array.from({ length: 4 }, () =>
        rpc(parent.client, "complete_session", {
          p_session_id: first.sessionId,
        }),
      ),
    );
    const replay = await playLesson(parent, child, "af-l1"); // replay the lesson
    await rpc(parent.client, "complete_session", {
      p_session_id: replay.sessionId,
    });
    const { data } = await parent.client
      .from("child_rewards")
      .select("reason, session_id, rewards(key)")
      .eq("child_id", child);
    expect(data?.length).toBe(1);
    expect(data?.[0]?.session_id).toBe(first.sessionId);
    expect(data?.[0]?.reason).toContain("af-l1");
    const r1 = await rpc<{ newRewards: string[] }>(
      parent.client,
      "get_session_result",
      {
        p_session_id: first.sessionId,
      },
    );
    const r2 = await rpc<{ newRewards: string[] }>(
      parent.client,
      "get_session_result",
      {
        p_session_id: replay.sessionId,
      },
    );
    expect(r1.newRewards).toEqual(["explorer-star"]);
    expect(r2.newRewards).toEqual([]);
    const o = await overview(child);
    const rec = o.lessons.find((l) => l.id === "af-l1")!.record!;
    expect(rec).toMatchObject({ bestStars: 3, plays: 2 });
  });

  it("stars are effort based and best result is kept", async () => {
    const child = await newChild("Sao");
    await playLessonWrong(parent, child, "af-l1");
    let o = await overview(child);
    expect(o.lessons.find((l) => l.id === "af-l1")!.record!.bestStars).toBe(1);
    await playLesson(parent, child, "af-l1");
    o = await overview(child);
    expect(o.lessons.find((l) => l.id === "af-l1")!.record!.bestStars).toBe(3);
    await playLessonWrong(parent, child, "af-l1");
    o = await overview(child);
    expect(o.lessons.find((l) => l.id === "af-l1")!.record!.bestStars).toBe(3);
  });
});

describe("skill mastery", () => {
  const mastery = async (child: string) =>
    (await overview(child)).mastery.find((m) => m.skillId === "af-s1");

  it("is not granted after one lesson, needs volume across sessions, and moves to review on decline", async () => {
    const child = await newChild("Thành thạo");
    await playLesson(parent, child, "af-l1");
    expect(await mastery(child)).toMatchObject({
      state: "learning",
      evidence: 3,
    });
    await playLesson(parent, child, "af-l2");
    expect(await mastery(child)).toMatchObject({
      state: "practicing",
      evidence: 6,
    });
    await playLesson(parent, child, "af-l1");
    await playLesson(parent, child, "af-l2");
    expect(await mastery(child)).toMatchObject({
      state: "mastered",
      evidence: 12,
    });
    await playLessonWrong(parent, child, "af-l1");
    await playLessonWrong(parent, child, "af-l2");
    const m = await mastery(child);
    expect(m?.state).toBe("review");
    expect(m?.accuracy).toBeLessThan(0.8);
  });

  it("retries do not count as evidence", async () => {
    const child = await newChild("Thử lại");
    await playLessonWrong(parent, child, "af-l1"); // 3 questions × 2 tries
    expect(await mastery(child)).toMatchObject({ evidence: 3, accuracy: 0 });
  });
});

describe("daily plan", () => {
  it("is stored once per day and stays stable", async () => {
    const child = await newChild("Kế hoạch");
    const today = new Date().toISOString().slice(0, 10);
    const a = await rpc<string[]>(parent.client, "ensure_daily_plan", {
      p_child_id: child,
      p_plan_date: today,
      p_lesson_slugs: ["af-l1", "nk-l1", "iq-l1"],
    });
    const b = await rpc<string[]>(parent.client, "ensure_daily_plan", {
      p_child_id: child,
      p_plan_date: today,
      p_lesson_slugs: ["mg-l1"],
    });
    expect(a).toEqual(["af-l1", "nk-l1", "iq-l1"]);
    expect(b).toEqual(a);
    const bad = await rpcError(parent.client, "ensure_daily_plan", {
      p_child_id: child,
      p_plan_date: "2020-01-01",
      p_lesson_slugs: ["af-l1"],
    });
    expect(bad.message).toBe("invalid_date");
  });
});

describe("content workflow & staff roles", () => {
  it("editor → reviewer/publisher flow with explicit permissions", async () => {
    const [editor, publisher, admin, outsider] = await Promise.all([
      createUser("editor"),
      createUser("publisher"),
      createUser("admin"),
      createUser("outsider"),
    ]);
    bootstrapStaffRole(admin.id, "admin");
    await rpc(admin.client, "grant_staff_role", {
      p_user_id: editor.id,
      p_role: "content_editor",
    });
    await rpc(admin.client, "grant_staff_role", {
      p_user_id: publisher.id,
      p_role: "publisher",
    });

    // Editor drafts a question (status cannot be set by the editor).
    const { data: skill } = await editor.client
      .from("skills")
      .select("id")
      .eq("slug", "af-s1")
      .single();
    const slug = `draft-${randomUUID().slice(0, 8)}`;
    const ins = await editor.client
      .from("questions")
      .insert({
        slug,
        skill_id: skill!.id,
        type: "image_choice",
        difficulty: 1,
        prompt_vi: "Thử",
        config: { options: [] },
      })
      .select("id, status")
      .single();
    expect(ins.error).toBeNull();
    expect(ins.data?.status).toBe("draft");
    const id = ins.data!.id as string;
    const setStatus = await editor.client
      .from("questions")
      .update({ status: "published" })
      .eq("id", id);
    expect(setStatus.error?.code).toBe("42501");

    // Drafts are invisible to families and outsiders.
    const hidden = await outsider.client
      .from("questions")
      .select("id")
      .eq("id", id);
    expect(hidden.data).toEqual([]);

    await rpc(editor.client, "set_content_status", {
      p_entity: "question",
      p_id: id,
      p_status: "in_review",
    });
    expect(
      (
        await rpcError(editor.client, "set_content_status", {
          p_entity: "question",
          p_id: id,
          p_status: "published",
        })
      ).message,
    ).toBe("forbidden");
    // Publisher cannot publish a question without a valid private key.
    expect(
      (
        await rpcError(publisher.client, "set_content_status", {
          p_entity: "question",
          p_id: id,
          p_status: "published",
        })
      ).message,
    ).toBe("key_missing");

    // Publisher can publish a valid lesson-level change (archive → draft cycle on a reward).
    const { data: reward } = await publisher.client
      .from("rewards")
      .select("id")
      .eq("key", "explorer-star")
      .single();
    await rpc(publisher.client, "set_content_status", {
      p_entity: "reward",
      p_id: reward!.id,
      p_status: "archived",
    });
    await rpc(editor.client, "set_content_status", {
      p_entity: "reward",
      p_id: reward!.id,
      p_status: "draft",
    });
    await rpc(editor.client, "set_content_status", {
      p_entity: "reward",
      p_id: reward!.id,
      p_status: "in_review",
    });
    await rpc(publisher.client, "set_content_status", {
      p_entity: "reward",
      p_id: reward!.id,
      p_status: "published",
    });

    const history = await editor.client
      .from("content_publication_history")
      .select("to_status")
      .eq("entity_id", reward!.id)
      .in("actor_id", [editor.id, publisher.id])
      .order("id");
    expect(history.data?.map((h) => h.to_status)).toEqual([
      "archived",
      "draft",
      "in_review",
      "published",
    ]);
    const audit = await admin.client
      .from("audit_logs")
      .select("action")
      .eq("entity_id", reward!.id)
      .in("actor_id", [editor.id, publisher.id]);
    expect(audit.data?.length).toBe(4);
    expect((await editor.client.from("audit_logs").select("id")).data).toEqual(
      [],
    );

    // Staff cannot read child data.
    const kids = await publisher.client.from("children").select("id");
    expect(kids.data).toEqual([]);
    const attempts = await admin.client.from("question_attempts").select("id");
    expect(attempts.data).toEqual([]);

    // Admin cannot lock themselves out.
    expect(
      (
        await rpcError(admin.client, "revoke_staff_role", {
          p_user_id: admin.id,
          p_role: "admin",
        })
      ).message,
    ).toBe("cannot_revoke_own_admin");
  });
});
