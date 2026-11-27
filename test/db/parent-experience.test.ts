import { randomUUID } from "node:crypto";

import { PLACEMENT_ASSESSMENT } from "@/data/demo/parent-guides";

import {
  anonClient,
  correctResponse,
  createChild,
  createFamily,
  createUser,
  LESSONS,
  ownerCount,
  PLACEMENT,
  playLesson,
  rpc,
  rpcError,
  type TestUser,
  wrongResponse,
} from "./helpers";

const QUESTIONS = new Map(
  LESSONS.flatMap((l) => l.questions.map((q) => [q.id, q] as const)),
);
const ITEMS = PLACEMENT_ASSESSMENT.questionSlugs.map((s) => QUESTIONS.get(s)!);

async function family(label: string) {
  const owner = await createUser(label);
  const familyId = await createFamily(owner, `Nhà ${label}`);
  const childId = await createChild(owner, familyId, "Bé");
  return { owner, familyId, childId };
}

interface RunState {
  runId: string;
  currentIndex: number;
  total: number;
  status: string;
  resumed: boolean;
}

const startRun = (u: TestUser, childId: string, restart = false) =>
  rpc<RunState>(u.client, "start_assessment", {
    p_child_id: childId,
    p_assessment_slug: PLACEMENT,
    p_restart: restart,
  });

const answer = (
  u: TestUser,
  runId: string,
  slug: string,
  response: Record<string, unknown>,
  key = randomUUID(),
) =>
  rpc<{ nextAction: string; currentIndex: number; replayed: boolean }>(
    u.client,
    "submit_assessment_item",
    {
      p_run_id: runId,
      p_question_slug: slug,
      p_response: response,
      p_idempotency_key: key,
    },
  );

describe("placement assessment", () => {
  it("records one answer per item, returns no correctness, and summarises by world", async () => {
    const { owner, childId } = await family("asm");
    const run = await startRun(owner, childId);
    expect(run.total).toBe(ITEMS.length);
    for (const [i, q] of ITEMS.entries()) {
      // right for the first half, wrong for the rest
      const r = await answer(
        owner,
        run.runId,
        q.id,
        i < 4 ? correctResponse(q) : wrongResponse(q),
      );
      expect(Object.keys(r).sort()).toEqual(
        ["currentIndex", "nextAction", "replayed"].sort(),
      );
      expect(r.nextAction).toBe(
        i === ITEMS.length - 1 ? "complete" : "continue",
      );
    }
    const summary = await rpc<{
      modules: Array<{
        moduleId: string;
        items: number;
        correct: number;
        band: string;
      }>;
    }>(owner.client, "get_assessment_summary", { p_child_id: childId });
    const bands = Object.fromEntries(
      summary.modules.map((m) => [m.moduleId, m.band]),
    );
    expect(bands).toEqual({
      "alphabet-forest": "confident",
      "number-kingdom": "confident",
      "iq-castle": "exploring",
      "memory-garden": "exploring",
      "school-town": "exploring",
    });
    // No mastery, stars or rewards from an observation activity.
    const report = await rpc<{ totals: { stars: number; badges: number } }>(
      owner.client,
      "get_child_report",
      { p_child_id: childId },
    );
    expect(report.totals).toMatchObject({ stars: 0, badges: 0 });
    expect(
      ownerCount(
        `select count(*) from public.skill_mastery where child_id = '${childId}'`,
      ),
    ).toBe(0);
  });

  it("is idempotent, resumable, and rejects skipped or malformed answers", async () => {
    const { owner, childId } = await family("asm2");
    const run = await startRun(owner, childId);
    const key = randomUUID();
    const first = await answer(
      owner,
      run.runId,
      ITEMS[0]!.id,
      correctResponse(ITEMS[0]!),
      key,
    );
    const again = await answer(
      owner,
      run.runId,
      ITEMS[0]!.id,
      correctResponse(ITEMS[0]!),
      key,
    );
    expect(again).toMatchObject({
      replayed: true,
      currentIndex: first.currentIndex,
    });
    expect(
      ownerCount(
        `select count(*) from public.assessment_attempts where run_id = '${run.runId}'`,
      ),
    ).toBe(1);

    expect(
      (
        await rpcError(owner.client, "submit_assessment_item", {
          p_run_id: run.runId,
          p_question_slug: ITEMS[3]!.id,
          p_response: correctResponse(ITEMS[3]!),
          p_idempotency_key: randomUUID(),
        })
      ).message,
    ).toBe("question_mismatch");
    expect(
      (
        await rpcError(owner.client, "submit_assessment_item", {
          p_run_id: run.runId,
          p_question_slug: ITEMS[1]!.id,
          p_response: { type: "ordering", order: ["x"] },
          p_idempotency_key: randomUUID(),
        })
      ).message,
    ).toBe("invalid_response");

    const resumed = await startRun(owner, childId);
    expect(resumed).toMatchObject({
      runId: run.runId,
      currentIndex: 1,
      resumed: true,
    });
    const restarted = await startRun(owner, childId, true);
    expect(restarted.runId).not.toBe(run.runId);
    expect(restarted.currentIndex).toBe(0);
  });

  it("is invisible and unusable for another family", async () => {
    const a = await family("asmA");
    const b = await family("asmB");
    const run = await startRun(a.owner, a.childId);
    expect(
      (
        await rpcError(b.owner.client, "start_assessment", {
          p_child_id: a.childId,
          p_assessment_slug: PLACEMENT,
          p_restart: false,
        })
      ).message,
    ).toBe("forbidden");
    expect(
      (
        await rpcError(b.owner.client, "submit_assessment_item", {
          p_run_id: run.runId,
          p_question_slug: ITEMS[0]!.id,
          p_response: correctResponse(ITEMS[0]!),
          p_idempotency_key: randomUUID(),
        })
      ).message,
    ).toBe("forbidden");
    const { data } = await b.owner.client
      .from("assessment_runs")
      .select("id")
      .eq("id", run.runId);
    expect(data).toEqual([]);
    expect(
      (
        await rpcError(b.owner.client, "get_assessment_summary", {
          p_child_id: a.childId,
        })
      ).message,
    ).toBe("forbidden");
    const anon = anonClient();
    expect(
      (await anon.from("assessment_runs").select("id")).data ?? [],
    ).toEqual([]);
    expect(
      (
        await rpcError(anon, "start_assessment", {
          p_child_id: a.childId,
          p_assessment_slug: PLACEMENT,
          p_restart: false,
        })
      ).code,
    ).toBe("42501");
  });
});

describe("placement content visibility", () => {
  it("publishes the activity like lessons, but never runs, answers or drafts", async () => {
    const anon = anonClient();
    const { data: a } = await anon
      .from("assessments")
      .select("slug, assessment_items(position)")
      .eq("slug", PLACEMENT)
      .single();
    expect(a?.assessment_items).toHaveLength(ITEMS.length);
    expect(
      (await anon.from("assessment_attempts").select("id")).data ?? [],
    ).toEqual([]);
    expect(
      (await anon.from("assessment_runs").select("id")).data ?? [],
    ).toEqual([]);
    // anon cannot write either
    const { error } = await anon
      .from("assessments")
      .insert({ slug: "x", title_vi: "x" });
    expect(error).not.toBeNull();
  });
});

describe("child report", () => {
  it("summarises completed lessons, modules and skills for the family only", async () => {
    const { owner, childId } = await family("rep");
    await playLesson(owner, childId, "af-l1");
    const report = await rpc<{
      totals: {
        sessionsCompleted: number;
        lessonsCompleted: number;
        stars: number;
        activeSeconds: number;
        activeDays7: number;
      };
      last7: Array<{ sessions: number }>;
      modules: Array<{ moduleId: string; completed: number; total: number }>;
      skills: Array<{ skillId: string; state: string; evidence: number }>;
      recent: Array<{ lessonId: string; stars: number; total: number }>;
    }>(owner.client, "get_child_report", { p_child_id: childId });
    expect(report.totals).toMatchObject({
      sessionsCompleted: 1,
      lessonsCompleted: 1,
      stars: 3,
      activeDays7: 1,
    });
    expect(report.totals.activeSeconds).toBeGreaterThanOrEqual(0);
    expect(report.last7).toHaveLength(7);
    expect(
      report.modules.find((m) => m.moduleId === "alphabet-forest"),
    ).toMatchObject({
      completed: 1,
      total: LESSONS.filter((l) => l.worldId === "alphabet-forest").length,
    });
    expect(report.skills).toHaveLength(14);
    expect(report.skills.find((s) => s.skillId === "af-s1")).toMatchObject({
      state: "learning",
    });
    expect(report.recent[0]).toMatchObject({ lessonId: "af-l1", stars: 3 });

    const other = await family("rep2");
    expect(
      (
        await rpcError(other.owner.client, "get_child_report", {
          p_child_id: childId,
        })
      ).message,
    ).toBe("forbidden");
  });
});

describe("guardian invitations", () => {
  it("lets an invited guardian join with consent, once, and see the family's children", async () => {
    const { owner, familyId, childId } = await family("inv");
    const invite = await rpc<{ code: string; id: string }>(
      owner.client,
      "create_family_invite",
      {},
    );
    expect(invite.code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
    // The hash is not readable, even by the owner.
    expect(
      (await owner.client.from("family_invitations").select("code_hash")).error,
    ).not.toBeNull();

    const guardian = await createUser("guardian");
    expect(
      (
        await rpcError(guardian.client, "accept_family_invite", {
          p_code: invite.code,
          p_consent_version: null,
        })
      ).message,
    ).toBe("consent_required");
    // Lower-case and without the dash is accepted (typed by a person).
    const joined = await rpc<string>(guardian.client, "accept_family_invite", {
      p_code: invite.code.replace("-", "").toLowerCase(),
      p_consent_version: "2026-11",
    });
    expect(joined).toBe(familyId);
    const { data: kids } = await guardian.client.from("children").select("id");
    expect(kids?.map((k) => k.id)).toEqual([childId]);

    const third = await createUser("third");
    expect(
      (
        await rpcError(third.client, "accept_family_invite", {
          p_code: invite.code,
          p_consent_version: "2026-11",
        })
      ).message,
    ).toBe("invite_invalid");
    expect(
      (
        await rpcError(third.client, "accept_family_invite", {
          p_code: "AAAAA-AAAAA",
          p_consent_version: "2026-11",
        })
      ).message,
    ).toBe("invite_invalid");

    // Guardians cannot invite, delete the family or remove people.
    expect(
      (await rpcError(guardian.client, "create_family_invite", {})).message,
    ).toBe("forbidden");
    expect(
      (
        await rpcError(guardian.client, "delete_family", {
          p_confirm_name: "Nhà inv",
        })
      ).message,
    ).toBe("forbidden");
    expect(
      (
        await rpcError(guardian.client, "remove_family_member", {
          p_user_id: owner.id,
        })
      ).message,
    ).toBe("forbidden");

    // Owner removes the guardian: access ends immediately.
    await rpc(owner.client, "remove_family_member", { p_user_id: guardian.id });
    expect((await guardian.client.from("children").select("id")).data).toEqual(
      [],
    );
    expect(
      (
        await rpcError(guardian.client, "get_child_report", {
          p_child_id: childId,
        })
      ).message,
    ).toBe("forbidden");
  });

  it("limits open invitations, supports revoking, and hides them from other families", async () => {
    const { owner } = await family("inv2");
    const ids: string[] = [];
    for (let i = 0; i < 3; i++)
      ids.push(
        (
          await rpc<{ id: string; code: string }>(
            owner.client,
            "create_family_invite",
            {},
          )
        ).id,
      );
    expect(
      (await rpcError(owner.client, "create_family_invite", {})).message,
    ).toBe("invite_limit");
    const revoked = await rpc<{ id: string; code: string }>(
      owner.client,
      "revoke_family_invite",
      { p_invite_id: ids[0] },
    ).then(() => null);
    expect(revoked).toBeNull();
    const fresh = await rpc<{ code: string }>(
      owner.client,
      "create_family_invite",
      {},
    );
    const other = await family("inv3");
    expect(
      (await other.owner.client.from("family_invitations").select("id")).data,
    ).toEqual([]);
    expect(
      (
        await rpcError(other.owner.client, "revoke_family_invite", {
          p_invite_id: ids[1],
        })
      ).code,
    ).toBe("42501");
    // Someone already in a family cannot join another.
    expect(
      (
        await rpcError(other.owner.client, "accept_family_invite", {
          p_code: fresh.code,
          p_consent_version: "2026-11",
        })
      ).message,
    ).toBe("already_in_family");
  });
});

describe("export & deletion", () => {
  it("exports exactly the caller's family", async () => {
    const a = await family("expA");
    const b = await family("expB");
    await playLesson(a.owner, a.childId, "af-l1");
    await playLesson(b.owner, b.childId, "nk-l1");
    const data = await rpc<{
      account: { email: string };
      family: { id: string };
      children: Array<{
        id: string;
        sessions: Array<{ lesson: string; attempts: unknown[] }>;
      }>;
    }>(a.owner.client, "export_family_data", {});
    expect(data.account.email).toBe(a.owner.email.toLowerCase());
    expect(data.family.id).toBe(a.familyId);
    expect(data.children.map((c) => c.id)).toEqual([a.childId]);
    expect(data.children[0]!.sessions[0]!.lesson).toBe("af-l1");
    expect(data.children[0]!.sessions[0]!.attempts.length).toBeGreaterThan(0);
    const text = JSON.stringify(data);
    expect(text).not.toContain(b.childId);
    expect(text.toLowerCase()).not.toContain(b.owner.email.toLowerCase());
    expect((await rpcError(anonClient(), "export_family_data", {})).code).toBe(
      "42501",
    );
  });

  it("deletes a family and all of its learning data only with the exact name, owner only", async () => {
    const { owner, familyId, childId } = await family("del");
    const other = await family("delOther");
    await playLesson(owner, childId, "af-l1");
    await startRun(owner, childId);
    expect(
      (
        await rpcError(owner.client, "delete_family", {
          p_confirm_name: "sai tên",
        })
      ).message,
    ).toBe("confirmation_mismatch");
    expect(
      (
        await rpcError(other.owner.client, "delete_family", {
          p_confirm_name: "Nhà del",
        })
      ).message,
    ).toBe("confirmation_mismatch");
    expect(
      ownerCount(
        `select count(*) from public.families where id = '${familyId}'`,
      ),
    ).toBe(1);

    await rpc(owner.client, "delete_family", { p_confirm_name: "Nhà del" });
    for (const t of [
      "children",
      "learning_sessions",
      "question_attempts",
      "child_lesson_progress",
      "skill_mastery",
      "child_rewards",
      "child_daily_plans",
      "assessment_runs",
    ]) {
      expect(
        ownerCount(
          `select count(*) from public.${t} where ${t === "children" ? "id" : "child_id"} = '${childId}'`,
        ),
        t,
      ).toBe(0);
    }
    expect(
      ownerCount(
        `select count(*) from public.families where id = '${familyId}'`,
      ),
    ).toBe(0);
    expect(
      ownerCount(
        `select count(*) from public.family_members where family_id = '${familyId}'`,
      ),
    ).toBe(0);
    expect(
      ownerCount(
        `select count(*) from public.guardian_consents where family_id = '${familyId}'`,
      ),
    ).toBe(0);
    // The other family is untouched.
    expect(
      ownerCount(
        `select count(*) from public.children where id = '${other.childId}'`,
      ),
    ).toBe(1);
  });

  it("deletes the account itself", async () => {
    const { owner, familyId } = await family("acct");
    expect(
      (await rpcError(owner.client, "delete_my_account", { p_confirm: "XOA" }))
        .message,
    ).toBe("confirmation_mismatch");
    await rpc(owner.client, "delete_my_account", { p_confirm: "Nhà acct" });
    expect(
      ownerCount(`select count(*) from auth.users where id = '${owner.id}'`),
    ).toBe(0);
    expect(
      ownerCount(
        `select count(*) from public.profiles where id = '${owner.id}'`,
      ),
    ).toBe(0);
    expect(
      ownerCount(
        `select count(*) from public.families where id = '${familyId}'`,
      ),
    ).toBe(0);
  });

  it("restores archived children and deletes them permanently only when archived", async () => {
    const { owner, childId } = await family("child");
    expect(
      (
        await rpcError(owner.client, "delete_child", {
          p_child_id: childId,
          p_confirm_nickname: "Bé",
        })
      ).message,
    ).toBe("child_not_archived");
    await rpc(owner.client, "archive_child", { p_child_id: childId });
    await rpc(owner.client, "restore_child", { p_child_id: childId });
    expect(
      ownerCount(
        `select count(*) from public.children where id = '${childId}' and status = 'active'`,
      ),
    ).toBe(1);
    await rpc(owner.client, "archive_child", { p_child_id: childId });
    const stranger = await family("child2");
    expect(
      (
        await rpcError(stranger.owner.client, "delete_child", {
          p_child_id: childId,
          p_confirm_nickname: "Bé",
        })
      ).message,
    ).toBe("forbidden");
    expect(
      (
        await rpcError(owner.client, "delete_child", {
          p_child_id: childId,
          p_confirm_nickname: "Be",
        })
      ).message,
    ).toBe("confirmation_mismatch");
    await rpc(owner.client, "delete_child", {
      p_child_id: childId,
      p_confirm_nickname: "Bé",
    });
    expect(
      ownerCount(
        `select count(*) from public.children where id = '${childId}'`,
      ),
    ).toBe(0);
  });
});
