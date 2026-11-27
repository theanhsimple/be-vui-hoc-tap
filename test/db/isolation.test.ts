import { randomUUID } from "node:crypto";

import {
  anonClient,
  correctResponse,
  createChild,
  createFamily,
  createUser,
  lesson,
  rpc,
  rpcError,
  startSession,
  submit,
  type TestUser,
  LESSONS,
} from "./helpers";

/**
 * Multi-family isolation (Sprint 04 §18). Two families:
 *   Family A: Parent A, children A1 + A2      Family B: Parent B, child B1
 * Every assertion runs as a signed-in user (or anon) through the public API.
 */

let parentA: TestUser;
let parentB: TestUser;
let stranger: TestUser; // signed in, no family
let familyA: string;
let familyB: string;
let a1: string;
let a2: string;
let b1: string;
let sessionB: string;

beforeAll(async () => {
  [parentA, parentB, stranger] = await Promise.all([
    createUser("parent-a"),
    createUser("parent-b"),
    createUser("stranger"),
  ]);
  familyA = await createFamily(parentA, "Gia đình A");
  familyB = await createFamily(parentB, "Gia đình B");
  a1 = await createChild(parentA, familyA, "A Một");
  a2 = await createChild(parentA, familyA, "A Hai");
  b1 = await createChild(parentB, familyB, "B Một");
  const s = await startSession(parentB, b1, "af-l1");
  sessionB = s.sessionId;
  await submit(
    parentB,
    sessionB,
    "af-l1-q1",
    correctResponse(lesson("af-l1").questions[0]!),
  );
});

const ids = (rows: Array<{ id: string }> | null) =>
  (rows ?? []).map((r) => r.id).sort();

describe("1–3. reading children", () => {
  it("1. Parent A sees exactly A1 and A2", async () => {
    const { data, error } = await parentA.client.from("children").select("id");
    expect(error).toBeNull();
    expect(ids(data)).toEqual([a1, a2].sort());
  });

  it("2. Parent A cannot see or open B1", async () => {
    const { data } = await parentA.client
      .from("children")
      .select("id")
      .eq("id", b1);
    expect(data).toEqual([]);
    const err = await rpcError(parentA.client, "get_student_overview", {
      p_child_id: b1,
    });
    expect(err.message).toBe("forbidden");
  });

  it("3. Parent B cannot see A1 or A2", async () => {
    const { data } = await parentB.client
      .from("children")
      .select("id")
      .in("id", [a1, a2]);
    expect(data).toEqual([]);
    for (const child of [a1, a2]) {
      const err = await rpcError(parentB.client, "get_student_overview", {
        p_child_id: child,
      });
      expect(err.message).toBe("forbidden");
    }
  });

  it("family, membership and consent rows are private too", async () => {
    const fam = await parentA.client.from("families").select("id");
    expect(ids(fam.data)).toEqual([familyA]);
    const members = await parentA.client.from("family_members").select("*");
    expect(members.data?.every((m) => m.family_id === familyA)).toBe(true);
    const consents = await parentA.client.from("guardian_consents").select("*");
    expect(consents.data?.every((c) => c.family_id === familyA)).toBe(true);
    const profiles = await parentA.client.from("profiles").select("id");
    expect(ids(profiles.data)).toEqual([parentA.id]);
  });
});

describe("4. modifying another family's child", () => {
  it("cannot update B1 (no rows affected, B1 unchanged)", async () => {
    const { data } = await parentA.client
      .from("children")
      .update({ nickname: "Hacked" })
      .eq("id", b1)
      .select("id");
    expect(data).toEqual([]);
    const { data: still } = await parentB.client
      .from("children")
      .select("nickname")
      .eq("id", b1)
      .single();
    expect(still?.nickname).toBe("B Một");
  });

  it("cannot archive B1 or add a child to family B", async () => {
    expect(
      (await rpcError(parentA.client, "archive_child", { p_child_id: b1 }))
        .message,
    ).toBe("forbidden");
    expect(
      (
        await rpcError(parentA.client, "create_child", {
          p_family_id: familyB,
          p_nickname: "Intruder",
          p_avatar_key: "sun",
        })
      ).message,
    ).toBe("forbidden");
  });

  it("cannot move a child to another family (family_id not updatable)", async () => {
    const { error } = await parentA.client
      .from("children")
      .update({ family_id: familyB })
      .eq("id", a1);
    expect(error?.code).toBe("42501");
  });

  it("cannot insert children directly", async () => {
    const { error } = await parentA.client
      .from("children")
      .insert({ family_id: familyA, nickname: "X", avatar_key: "sun" });
    expect(error?.code).toBe("42501");
  });
});

describe("5–6. another family's learning data", () => {
  it("5. Parent A cannot read Family B's sessions, attempts or progress", async () => {
    for (const table of [
      "learning_sessions",
      "question_attempts",
      "skill_mastery",
      "child_lesson_progress",
      "child_rewards",
      "child_daily_plans",
    ]) {
      const { data, error } = await parentA.client.from(table).select("*");
      expect(error, table).toBeNull();
      expect(data, table).toEqual([]);
    }
    const err = await rpcError(parentA.client, "get_session_state", {
      p_session_id: sessionB,
    });
    expect(err.message).toBe("forbidden");
  });

  it("6. Parent A cannot modify Family B's attempts or session", async () => {
    const ins = await parentA.client.from("question_attempts").insert({
      session_id: sessionB,
      child_id: b1,
      question_id: randomUUID(),
      skill_id: randomUUID(),
      attempt_no: 2,
      response: {},
      is_correct: true,
      score: 1,
      max_score: 1,
      is_final: true,
      feedback_text: "x",
      idempotency_key: randomUUID(),
    });
    expect(ins.error?.code).toBe("42501");
    const upd = await parentA.client
      .from("question_attempts")
      .update({ is_correct: true })
      .eq("session_id", sessionB);
    expect(upd.error?.code).toBe("42501");
    const del = await parentA.client
      .from("learning_sessions")
      .delete()
      .eq("id", sessionB);
    expect(del.error?.code).toBe("42501");
    const q2 = lesson("af-l1").questions[1]!;
    const err = await rpcError(parentA.client, "submit_attempt", {
      p_session_id: sessionB,
      p_question_slug: q2.id,
      p_response: correctResponse(q2),
      p_idempotency_key: randomUUID(),
    });
    expect(err.message).toBe("forbidden");
    for (const fn of [
      "abandon_session",
      "complete_session",
      "get_session_result",
    ]) {
      expect(
        (await rpcError(parentA.client, fn, { p_session_id: sessionB }))
          .message,
      ).toBe("forbidden");
    }
    // B's session is untouched
    const state = await rpc<{ currentIndex: number; status: string }>(
      parentB.client,
      "get_session_state",
      { p_session_id: sessionB },
    );
    expect(state).toMatchObject({ currentIndex: 1, status: "in_progress" });
  });

  it("parents cannot write their OWN child's learning data directly either", async () => {
    const { error } = await parentB.client
      .from("learning_sessions")
      .update({ stars: 3 })
      .eq("id", sessionB);
    expect(error?.code).toBe("42501");
    const rw = await parentB.client
      .from("child_rewards")
      .insert({ child_id: b1, reward_id: randomUUID(), reason: "self" });
    expect(rw.error?.code).toBe("42501");
  });
});

describe("7. private answer keys", () => {
  it("are not reachable through the API", async () => {
    const viaSchema = await parentA.client
      .schema("private")
      .from("question_answer_keys")
      .select("*");
    expect(viaSchema.error).not.toBeNull();
    const asPublic = await parentA.client
      .from("question_answer_keys")
      .select("*");
    expect(asPublic.error).not.toBeNull();
  });

  it("public question rows carry no correctness data", async () => {
    const { data, error } = await parentA.client
      .from("questions")
      .select("*")
      .limit(1000);
    expect(error).toBeNull();
    expect(data?.length).toBe(LESSONS.flatMap((l) => l.questions).length);
    const text = JSON.stringify(data);
    expect(text).not.toMatch(
      /"optionId"|"hint_eliminate"|"answer"|"fills"|"order"/,
    );
  });

  it("private helper functions are not callable through the API", async () => {
    const { error } = await parentA.client.rpc("grade_response", {});
    expect(error).not.toBeNull();
    const k = await parentA.client.rpc("question_key_problem", {
      p_question_id: randomUUID(),
    });
    expect(k.error).not.toBeNull();
  });
});

describe("8. anonymous visitors", () => {
  it("cannot read any private table", async () => {
    const anon = anonClient();
    for (const table of [
      "children",
      "families",
      "family_members",
      "profiles",
      "learning_sessions",
      "question_attempts",
      "skill_mastery",
      "child_rewards",
      "staff_roles",
      "audit_logs",
    ]) {
      const { data, error } = await anon.from(table).select("*");
      // Either an explicit permission error or no rows — never data.
      expect(error !== null || (data ?? []).length === 0, table).toBe(true);
    }
  });

  it("cannot call learning RPCs", async () => {
    const anon = anonClient();
    for (const [fn, args] of [
      ["start_session", { p_child_id: a1, p_lesson_slug: "af-l1" }],
      ["get_student_overview", { p_child_id: a1 }],
      ["create_family", { p_display_name: "x", p_consent_version: "1" }],
      [
        "submit_attempt",
        {
          p_session_id: sessionB,
          p_question_slug: "af-l1-q2",
          p_response: {},
          p_idempotency_key: randomUUID(),
        },
      ],
    ] as const) {
      const { error } = await anon.rpc(fn, args);
      expect(error, fn).not.toBeNull();
    }
  });

  it("can read published learning content only", async () => {
    const anon = anonClient();
    const { data } = await anon.from("modules").select("slug,status");
    expect(data?.length).toBe(7);
    expect(data?.every((m) => m.status === "published")).toBe(true);
  });
});

describe("9. privilege escalation", () => {
  it("cannot grant themselves a staff role", async () => {
    const ins = await stranger.client
      .from("staff_roles")
      .insert({ user_id: stranger.id, role: "admin" });
    expect(ins.error?.code).toBe("42501");
    const viaRpc = await rpcError(stranger.client, "grant_staff_role", {
      p_user_id: stranger.id,
      p_role: "admin",
    });
    expect(viaRpc.message).toBe("forbidden");
    const { data } = await stranger.client.from("staff_roles").select("*");
    expect(data).toEqual([]);
  });

  it("cannot join another family or promote membership", async () => {
    const join = await stranger.client
      .from("family_members")
      .insert({ family_id: familyA, user_id: stranger.id, role: "owner" });
    expect(join.error?.code).toBe("42501");
    const promote = await parentA.client
      .from("family_members")
      .update({ role: "owner" })
      .eq("user_id", parentA.id);
    expect(promote.error?.code).toBe("42501");
  });

  it("cannot publish content", async () => {
    const { data: q } = await parentA.client
      .from("questions")
      .select("id")
      .eq("slug", "af-l1-q1")
      .single();
    const err = await rpcError(parentA.client, "set_content_status", {
      p_entity: "question",
      p_id: q!.id,
      p_status: "archived",
    });
    expect(err.message).toBe("forbidden");
    const direct = await parentA.client
      .from("questions")
      .update({ status: "archived" })
      .eq("id", q!.id);
    expect(direct.error?.code).toBe("42501");
  });
});

describe("10. tampered child id", () => {
  it("starting or planning for another family's child is refused", async () => {
    expect(
      (
        await rpcError(parentA.client, "start_session", {
          p_child_id: b1,
          p_lesson_slug: "af-l1",
        })
      ).message,
    ).toBe("forbidden");
    expect(
      (
        await rpcError(parentA.client, "ensure_daily_plan", {
          p_child_id: b1,
          p_plan_date: new Date().toISOString().slice(0, 10),
          p_lesson_slugs: ["af-l1"],
        })
      ).message,
    ).toBe("forbidden");
    // A random (non-existent) id gives the same answer: no probing.
    expect(
      (
        await rpcError(parentA.client, "get_student_overview", {
          p_child_id: randomUUID(),
        })
      ).message,
    ).toBe("forbidden");
  });
});

describe("family rules", () => {
  it("one owned family per account", async () => {
    const err = await rpcError(parentA.client, "create_family", {
      p_display_name: "Second",
      p_consent_version: "2026-11",
    });
    expect(err.message).toBe("family_exists");
  });

  it("consent is required to create a family", async () => {
    const err = await rpcError(stranger.client, "create_family", {
      p_display_name: "No consent",
      p_consent_version: "",
    });
    expect(err.message).toBe("consent_required");
  });

  it("archived children cannot start lessons and leave profile selection", async () => {
    const tmp = await createChild(parentA, familyA, "Tạm");
    await rpc(parentA.client, "archive_child", { p_child_id: tmp });
    await rpc(parentA.client, "archive_child", { p_child_id: tmp }); // idempotent
    const err = await rpcError(parentA.client, "start_session", {
      p_child_id: tmp,
      p_lesson_slug: "af-l1",
    });
    expect(err.message).toBe("child_archived");
    const { data } = await parentA.client
      .from("children")
      .select("status")
      .eq("id", tmp)
      .single();
    expect(data?.status).toBe("archived");
  });
});
