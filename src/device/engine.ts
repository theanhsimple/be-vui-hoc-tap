import type { AnswerKey } from "@/features/learning/grading/keys";
import type {
  Overview,
  SessionResult,
  SessionState,
} from "@/features/learning/backend/overview";
import type { PlacementRun } from "@/features/learning/backend/placement";
import { dateKeyIn } from "@/features/learning/progress/calc";
import type { LearningQuestion, Reveal } from "@/features/learning/types";
import type {
  AssessmentSummary,
  ChildReport,
} from "@/features/parent/report-model";

import type { DeviceContent } from "./content";
import type {
  DAttempt,
  DeviceChild,
  DeviceState,
  DRun,
  DSession,
} from "./state";

/**
 * DEVICE EDITION learning engine — a TypeScript port of the PostgreSQL rules
 * in supabase/migrations (grading, attempts, progression D-031, stars D-032,
 * rewards, mastery D-042, placement D-050, parent report D-051). Pure: every
 * function takes the state and returns a new one; nothing is mutated.
 * Results use the same JSON shapes as the database RPCs, so the screens are
 * shared with the server edition.
 */

export class EngineError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "EngineError";
  }
}
const fail = (code: string): never => {
  throw new EngineError(code);
};

export type Clock = () => Date;

export const MAX_CHILDREN = 6;
const MASTERY = {
  minAccuracy: 0.8,
  minEvidence: 10,
  minSessions: 2,
  minDistinct: 4,
  windowDays: 60,
  learningMaxEvidence: 4,
  learningMaxAccuracy: 0.5,
};

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  // RFC 4122 v4 from Math.random (only where crypto.randomUUID is missing).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Children ────────────────────────────────────────────────────────────

export interface ChildInput {
  nickname: string;
  avatarKey: string;
  birthYear: number | null;
  preferences: DeviceChild["preferences"];
}

const activeCount = (s: DeviceState) =>
  s.children.filter((c) => c.status === "active").length;

export function createChild(
  s: DeviceState,
  input: ChildInput,
  now: Date,
): { state: DeviceState; childId: string } {
  if (activeCount(s) >= MAX_CHILDREN) fail("child_limit");
  const child: DeviceChild = {
    id: newId(),
    nickname: input.nickname,
    avatarKey: input.avatarKey,
    birthYear: input.birthYear,
    preferences: input.preferences,
    status: "active",
    createdAt: now.toISOString(),
    archivedAt: null,
    rewardsSeenAt: null,
  };
  return {
    state: { ...s, children: [...s.children, child] },
    childId: child.id,
  };
}

export function getChild(s: DeviceState, childId: string) {
  return s.children.find((c) => c.id === childId);
}

function requireChild(s: DeviceState, childId: string, active = true) {
  const c = getChild(s, childId) ?? fail("forbidden");
  if (active && c.status !== "active") fail("child_archived");
  return c;
}

export function updateChild(
  s: DeviceState,
  childId: string,
  input: ChildInput,
): DeviceState {
  requireChild(s, childId);
  return {
    ...s,
    children: s.children.map((c) =>
      c.id === childId
        ? {
            ...c,
            nickname: input.nickname,
            avatarKey: input.avatarKey,
            birthYear: input.birthYear,
            preferences: input.preferences,
          }
        : c,
    ),
  };
}

export function archiveChild(
  s: DeviceState,
  childId: string,
  now: Date,
): DeviceState {
  const c = requireChild(s, childId, false);
  if (c.status === "archived") return s;
  const at = now.toISOString();
  return {
    ...s,
    selectedChildId: s.selectedChildId === childId ? null : s.selectedChildId,
    children: s.children.map((x) =>
      x.id === childId ? { ...x, status: "archived", archivedAt: at } : x,
    ),
    sessions: s.sessions.map((x) =>
      x.childId === childId && x.status === "in_progress"
        ? { ...x, status: "abandoned", abandonedAt: at, updatedAt: at }
        : x,
    ),
  };
}

export function restoreChild(s: DeviceState, childId: string): DeviceState {
  const c = requireChild(s, childId, false);
  if (c.status === "active") return s;
  if (activeCount(s) >= MAX_CHILDREN) fail("child_limit");
  return {
    ...s,
    children: s.children.map((x) =>
      x.id === childId ? { ...x, status: "active", archivedAt: null } : x,
    ),
  };
}

/** Permanent deletion of an ARCHIVED child and all of its data. */
export function deleteChild(
  s: DeviceState,
  childId: string,
  confirmNickname: string,
): DeviceState {
  const c = requireChild(s, childId, false);
  if (c.status !== "archived") fail("child_not_archived");
  if (confirmNickname.trim() !== c.nickname) fail("confirmation_mismatch");
  const keep = <T extends { childId: string }>(xs: T[]) =>
    xs.filter((x) => x.childId !== childId);
  return {
    ...s,
    selectedChildId: s.selectedChildId === childId ? null : s.selectedChildId,
    children: s.children.filter((x) => x.id !== childId),
    sessions: keep(s.sessions),
    attempts: keep(s.attempts),
    progress: keep(s.progress),
    mastery: keep(s.mastery),
    rewards: keep(s.rewards),
    plans: keep(s.plans),
    runs: keep(s.runs),
    runAnswers: keep(s.runAnswers),
  };
}

export function selectChild(s: DeviceState, childId: string | null) {
  if (childId !== null) requireChild(s, childId);
  return { ...s, selectedChildId: childId };
}

export function markRewardsSeen(s: DeviceState, childId: string, now: Date) {
  return {
    ...s,
    children: s.children.map((c) =>
      c.id === childId ? { ...c, rewardsSeenAt: now.toISOString() } : c,
    ),
  };
}

// ── Grading (port of private.grade_response) ────────────────────────────

export interface Grade {
  valid: boolean;
  score: number;
  maxScore: number;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const pairList = (v: unknown): v is Array<[string, string]> =>
  Array.isArray(v) &&
  v.every(
    (p) =>
      Array.isArray(p) &&
      p.length === 2 &&
      typeof p[0] === "string" &&
      typeof p[1] === "string",
  );

/** Memory pairs come from the public cards (pairKey), like the seed's key. */
export function memoryPairs(q: LearningQuestion): Array<[string, string]> {
  if (q.type !== "memory") return [];
  const groups = new Map<string, string[]>();
  for (const c of q.config.cards)
    groups.set(c.pairKey, [...(groups.get(c.pairKey) ?? []), c.id]);
  return [...groups.values()].map((ids) => [ids[0]!, ids[1]!]);
}

export function gradeResponse(
  q: LearningQuestion,
  key: AnswerKey,
  response: unknown,
): Grade {
  const invalid: Grade = { valid: false, score: 0, maxScore: 1 };
  if (!isObj(response) || response.type !== q.type) return invalid;

  switch (q.type) {
    case "single_choice":
    case "image_choice": {
      const opt = response.optionId;
      if (typeof opt !== "string" || !q.options.some((o) => o.id === opt))
        return invalid;
      const right = key.type === "choice" ? key.optionId : null;
      return { valid: true, score: opt === right ? 1 : 0, maxScore: 1 };
    }
    case "matching": {
      const pairs = response.pairs;
      if (!pairList(pairs) || pairs.length < 1 || pairs.length > 20)
        return invalid;
      const left = new Set(q.config.left.map((x) => x.id));
      const right = new Set(q.config.right.map((x) => x.id));
      if (pairs.some(([l, r]) => !left.has(l) || !right.has(r))) return invalid;
      if (
        new Set(pairs.map((p) => p[0])).size !== pairs.length ||
        new Set(pairs.map((p) => p[1])).size !== pairs.length
      )
        return invalid;
      const answer = key.type === "matching" ? key.pairs : [];
      const good = new Set(answer.map(([l, r]) => `${l}→${r}`));
      return {
        valid: answer.length > 0,
        score: pairs.filter(([l, r]) => good.has(`${l}→${r}`)).length,
        maxScore: answer.length,
      };
    }
    case "memory": {
      const pairs = response.pairs;
      if (!pairList(pairs) || pairs.length < 1 || pairs.length > 20)
        return invalid;
      const ids = new Set(q.config.cards.map((c) => c.id));
      if (pairs.some(([a, b]) => !ids.has(a) || !ids.has(b))) return invalid;
      if (new Set(pairs.flat()).size !== pairs.length * 2) return invalid;
      if (
        "moves" in response &&
        (typeof response.moves !== "number" ||
          response.moves < 0 ||
          response.moves > 500)
      )
        return invalid;
      const answer = memoryPairs(q);
      const good = new Set(
        answer.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]),
      );
      return {
        valid: answer.length > 0,
        score: pairs.filter(([a, b]) => good.has(`${a}|${b}`)).length,
        maxScore: answer.length,
      };
    }
    case "ordering": {
      const order = response.order;
      const items = q.config.items.map((i) => i.id);
      if (!strings(order) || order.length !== items.length) return invalid;
      if (order.some((x) => !items.includes(x))) return invalid;
      if (new Set(order).size !== order.length) return invalid;
      const answer = key.type === "ordering" ? key.order : [];
      return {
        valid: answer.length > 0,
        score: order.filter((x, i) => answer[i] === x).length,
        maxScore: answer.length,
      };
    }
    case "pattern": {
      const fills = response.fills;
      const palette = new Set(q.config.palette.map((p) => p.id));
      const blanks = q.config.sequence.filter((x) => x === null).length;
      if (!strings(fills) || fills.length !== blanks) return invalid;
      if (fills.some((f) => !palette.has(f))) return invalid;
      const answer = key.type === "pattern" ? key.fills : [];
      return {
        valid: answer.length > 0,
        score: fills.filter((f, i) => answer[i] === f).length,
        maxScore: answer.length,
      };
    }
  }
}

/** The correct answer of a finished wrong question (D-040); none for memory. */
export function revealFor(key: AnswerKey): Reveal | undefined {
  switch (key.type) {
    case "choice":
      return { type: "choice", optionId: key.optionId };
    case "matching":
      return { type: "matching", pairs: key.pairs };
    case "ordering":
      return { type: "ordering", order: key.order };
    case "pattern":
      return { type: "pattern", fills: key.fills };
    default:
      return undefined;
  }
}

// ── Progression (port of private.child_lesson_states, D-031) ────────────

export type LessonStateValue = "locked" | "available" | "completed";

export function lessonStates(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
): Record<string, LessonStateValue> {
  const done = new Set(
    s.progress.filter((p) => p.childId === childId).map((p) => p.lessonId),
  );
  const out: Record<string, LessonStateValue> = {};
  for (const l of c.lessonOrder) {
    const unlockAfter = c.worldUnlock[l.worldId];
    out[l.id] = done.has(l.id)
      ? "completed"
      : unlockAfter !== null &&
          unlockAfter !== undefined &&
          done.size < unlockAfter
        ? "locked"
        : l.prevId === null || done.has(l.prevId)
          ? "available"
          : "locked";
  }
  return out;
}

export function starsFor(firstTry: number, total: number): number {
  if (total <= 0) return 0;
  return (
    1 +
    (firstTry >= Math.ceil(total / 2) ? 1 : 0) +
    (firstTry === total ? 1 : 0)
  );
}

// ── Sessions ────────────────────────────────────────────────────────────

function sessionOf(s: DeviceState, sessionId: string, childId: string) {
  const x = s.sessions.find((v) => v.id === sessionId);
  if (!x || x.childId !== childId) fail("forbidden");
  return x!;
}

export function sessionState(
  s: DeviceState,
  c: DeviceContent,
  session: DSession,
): SessionState {
  const lesson = c.lesson(session.lessonId)!;
  const current = lesson.questions[session.currentIndex];
  const attempts = s.attempts.filter((a) => a.sessionId === session.id);
  const results = lesson.questions.flatMap((q) => {
    const mine = attempts.filter((a) => a.questionId === q.id);
    if (!mine.some((a) => a.isFinal)) return [];
    return [
      {
        questionId: q.id,
        correct: mine.some((a) => a.isCorrect),
        firstTry: mine.some((a) => a.isCorrect && a.attemptNo === 1),
        attempts: Math.max(...mine.map((a) => a.attemptNo)),
      },
    ];
  });
  return {
    sessionId: session.id,
    lessonId: session.lessonId,
    status: session.status,
    currentIndex: session.currentIndex,
    total: session.total,
    startedAt: session.startedAt,
    attempt: current
      ? attempts.filter((a) => a.questionId === current.id).length + 1
      : 1,
    results,
  };
}

export function startSession(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
  lessonId: string,
  restart: boolean,
  now: Date,
): { state: DeviceState; session: SessionState } {
  requireChild(s, childId);
  const lesson = c.lesson(lessonId) ?? fail("lesson_not_found");
  const st = lessonStates(s, c, childId)[lessonId];
  if (!st) fail("lesson_not_found");
  if (st === "locked") fail("lesson_locked");
  const at = now.toISOString();
  let sessions = s.sessions;
  let open = sessions.find(
    (x) =>
      x.childId === childId &&
      x.lessonId === lessonId &&
      x.status === "in_progress",
  );
  if (open && restart) {
    sessions = sessions.map((x) =>
      x.id === open!.id
        ? { ...x, status: "abandoned" as const, abandonedAt: at, updatedAt: at }
        : x,
    );
    open = undefined;
  }
  if (!open) {
    open = {
      id: newId(),
      childId,
      lessonId,
      status: "in_progress",
      currentIndex: 0,
      total: lesson.questions.length,
      correct: 0,
      incorrect: 0,
      firstTry: 0,
      score: 0,
      maxScore: 0,
      stars: null,
      startedAt: at,
      updatedAt: at,
      completedAt: null,
      abandonedAt: null,
    };
    sessions = [...sessions, open];
  }
  const state = { ...s, sessions };
  return { state, session: sessionState(state, c, open) };
}

export function activeSession(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
  lessonId: string,
): SessionState | null {
  const open = s.sessions.find(
    (x) =>
      x.childId === childId &&
      x.lessonId === lessonId &&
      x.status === "in_progress",
  );
  return open ? sessionState(s, c, open) : null;
}

const CORRECT_MESSAGES = [
  "Đúng rồi! Con nhìn rất kỹ!",
  "Chính xác! Con cố gắng tuyệt lắm!",
  "Đúng rồi! Mình cùng đi tiếp nhé!",
];

export interface AttemptOutcome {
  isCorrect: boolean;
  canRetry: boolean;
  nextAction: "retry" | "continue" | "complete";
  feedback: { text: string };
  reveal: Reveal | null;
}

/** Port of public.submit_attempt (single device: no idempotency needed). */
export function submitAttempt(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
  sessionId: string,
  questionId: string,
  response: unknown,
  now: Date,
): { state: DeviceState; outcome: AttemptOutcome } {
  requireChild(s, childId);
  const session = sessionOf(s, sessionId, childId);
  if (session.status !== "in_progress") fail("session_not_active");
  const lesson = c.lesson(session.lessonId)!;
  const q = lesson.questions[session.currentIndex];
  if (!q || q.id !== questionId) fail("question_mismatch");
  const info = c.info(q!.id) ?? fail("question_unavailable");
  const question = q!;
  const attemptNo =
    s.attempts.filter(
      (a) => a.sessionId === sessionId && a.questionId === question.id,
    ).length + 1;
  const maxAttempts = question.maxAttempts ?? 2;
  if (attemptNo > maxAttempts) fail("question_closed");
  const g = gradeResponse(question, info.key, response);
  if (!g.valid) fail("invalid_response");

  const correct = g.score === g.maxScore;
  const final = correct || attemptNo >= maxAttempts;
  const text = correct
    ? (question.feedback?.correctText ?? CORRECT_MESSAGES[attemptNo % 3]!)
    : final
      ? "Cùng xem đáp án nhé. Lần sau con sẽ làm được!"
      : (question.feedback?.incorrectText ?? "Gần đúng rồi! Con thử lại nhé.");
  const at = now.toISOString();
  const attempt: DAttempt = {
    sessionId,
    childId,
    questionId: question.id,
    skillId: info.skillId,
    attemptNo,
    response,
    isCorrect: correct,
    score: g.score,
    maxScore: g.maxScore,
    isFinal: final,
    feedback: text,
    createdAt: at,
  };
  let state: DeviceState = { ...s, attempts: [...s.attempts, attempt] };
  if (attemptNo === 1)
    state = recomputeMastery(state, childId, info.skillId, now);

  let next: AttemptOutcome["nextAction"] = "retry";
  if (final) {
    const updated: DSession = {
      ...session,
      currentIndex: session.currentIndex + 1,
      correct: session.correct + (correct ? 1 : 0),
      incorrect: session.incorrect + (correct ? 0 : 1),
      firstTry: session.firstTry + (correct && attemptNo === 1 ? 1 : 0),
      score: session.score + g.score,
      maxScore: session.maxScore + g.maxScore,
      updatedAt: at,
    };
    state = {
      ...state,
      sessions: state.sessions.map((x) => (x.id === sessionId ? updated : x)),
    };
    if (updated.currentIndex >= updated.total) {
      state = finishSession(state, c, sessionId, now);
      next = "complete";
    } else next = "continue";
  }
  return {
    state,
    outcome: {
      isCorrect: correct,
      canRetry: !final,
      nextAction: next,
      feedback: { text },
      reveal: final && !correct ? (revealFor(info.key) ?? null) : null,
    },
  };
}

export function requestHint(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
  sessionId: string,
  questionId: string,
): { text: string; eliminateOptionId: string | null } {
  const session = sessionOf(s, sessionId, childId);
  if (session.status !== "in_progress") fail("session_not_active");
  const q = c.lesson(session.lessonId)!.questions[session.currentIndex];
  if (!q || q.id !== questionId) fail("question_mismatch");
  const key = c.info(questionId)?.key;
  return {
    text: q!.feedback?.hint ?? "Con nhìn thật kỹ từng hình nhé.",
    eliminateOptionId:
      key?.type === "choice" && key.hintEliminate ? key.hintEliminate : null,
  };
}

function finishSession(
  s: DeviceState,
  c: DeviceContent,
  sessionId: string,
  now: Date,
): DeviceState {
  const session = s.sessions.find((x) => x.id === sessionId)!;
  if (session.status !== "in_progress" || session.currentIndex < session.total)
    return s;
  const at = now.toISOString();
  const stars = starsFor(session.firstTry, session.total);
  const sessions = s.sessions.map((x) =>
    x.id === sessionId
      ? {
          ...x,
          status: "completed" as const,
          completedAt: at,
          stars,
          updatedAt: at,
        }
      : x,
  );
  const prev = s.progress.find(
    (p) => p.childId === session.childId && p.lessonId === session.lessonId,
  );
  const progress = prev
    ? s.progress.map((p) =>
        p === prev
          ? {
              ...p,
              bestStars: Math.max(p.bestStars, stars),
              completions: p.completions + 1,
              lastSessionId: sessionId,
              lastCompletedAt: at,
            }
          : p,
      )
    : [
        ...s.progress,
        {
          childId: session.childId,
          lessonId: session.lessonId,
          bestStars: stars,
          completions: 1,
          lastSessionId: sessionId,
          firstCompletedAt: at,
          lastCompletedAt: at,
        },
      ];
  return evaluateRewards(
    { ...s, sessions, progress },
    c,
    session.childId,
    sessionId,
    now,
  );
}

function evaluateRewards(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
  sessionId: string,
  now: Date,
): DeviceState {
  const done = s.progress.filter((p) => p.childId === childId);
  const worldOf = new Map(c.lessonOrder.map((l) => [l.id, l.worldId]));
  const lessonId = s.sessions.find((x) => x.id === sessionId)?.lessonId ?? "";
  const have = new Set(
    s.rewards.filter((r) => r.childId === childId).map((r) => r.rewardId),
  );
  const granted = [...s.rewards];
  for (const r of c.rewards) {
    if (have.has(r.id)) continue;
    const rule = r.rule;
    const ok =
      rule.kind === "lessons_completed"
        ? done.length >= rule.count
        : rule.kind === "modules_explored"
          ? new Set(done.map((d) => worldOf.get(d.lessonId))).size >= rule.count
          : done.filter((d) => worldOf.get(d.lessonId) === rule.module)
              .length >= rule.count;
    if (ok)
      granted.push({
        childId,
        rewardId: r.id,
        sessionId,
        reason: `${r.criteria} (bài ${lessonId})`,
        grantedAt: now.toISOString(),
      });
  }
  return { ...s, rewards: granted };
}

/** Port of private.recompute_skill_mastery (D-042). */
export function recomputeMastery(
  s: DeviceState,
  childId: string,
  skillId: string,
  now: Date,
): DeviceState {
  const since = now.getTime() - MASTERY.windowDays * 86_400_000;
  const ev = s.attempts.filter(
    (a) =>
      a.childId === childId &&
      a.skillId === skillId &&
      a.attemptNo === 1 &&
      Date.parse(a.createdAt) >= since,
  );
  const correct = ev.filter((a) => a.isCorrect).length;
  const distinct = new Set(ev.map((a) => a.questionId)).size;
  const sessions = new Set(ev.map((a) => a.sessionId)).size;
  const acc = ev.length ? Math.round((correct / ev.length) * 1000) / 1000 : 0;
  const prev = s.mastery.find(
    (m) => m.childId === childId && m.skillId === skillId,
  );
  const mastered =
    ev.length >= MASTERY.minEvidence &&
    acc >= MASTERY.minAccuracy &&
    sessions >= MASTERY.minSessions &&
    distinct >= MASTERY.minDistinct;
  const state = mastered
    ? "mastered"
    : prev?.masteredAt
      ? "review"
      : ev.length === 0
        ? "not_started"
        : ev.length <= MASTERY.learningMaxEvidence ||
            acc < MASTERY.learningMaxAccuracy
          ? "learning"
          : "practicing";
  const at = now.toISOString();
  const row = {
    childId,
    skillId,
    state: state as "mastered",
    accuracy: acc,
    evidence: ev.length,
    distinct,
    sessions,
    masteredAt: mastered
      ? (prev?.masteredAt ?? at)
      : (prev?.masteredAt ?? null),
    lastPracticedAt: at,
  };
  return {
    ...s,
    mastery: prev
      ? s.mastery.map((m) => (m === prev ? row : m))
      : [...s.mastery, row],
  };
}

export function sessionResult(
  s: DeviceState,
  childId: string,
  sessionId: string,
): SessionResult | null {
  const x = s.sessions.find((v) => v.id === sessionId && v.childId === childId);
  if (!x) return null;
  return {
    sessionId: x.id,
    lessonId: x.lessonId,
    status: x.status,
    stars: x.stars ?? 0,
    total: x.total,
    correct: x.correct,
    firstTry: x.firstTry,
    completedAt: x.completedAt,
    newRewards: s.rewards
      .filter((r) => r.sessionId === x.id)
      .map((r) => r.rewardId),
  };
}

// ── Overview (port of public.get_student_overview) ──────────────────────

export function overview(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
): Overview {
  const child = requireChild(s, childId);
  const states = lessonStates(s, c, childId);
  const progress = s.progress.filter((p) => p.childId === childId);
  const done = progress.length;
  const sessions = s.sessions.filter((x) => x.childId === childId);
  const rewards = s.rewards.filter((r) => r.childId === childId);
  const open = sessions
    .filter((x) => x.status === "in_progress")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const history = [
    ...sessions
      .filter((x) => x.status === "completed")
      .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
      .slice(0, 100)
      .map((x) => ({
        type: "lesson" as const,
        lessonId: x.lessonId,
        stars: x.stars ?? 0,
        at: x.completedAt!,
      })),
    ...[...rewards]
      .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt))
      .slice(0, 50)
      .map((r) => ({
        type: "badge" as const,
        rewardId: r.rewardId,
        at: r.grantedAt,
      })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return {
    child: {
      id: child.id,
      nickname: child.nickname,
      avatarKey: child.avatarKey,
      rewardsSeenAt: child.rewardsSeenAt,
    },
    modules: c.catalog.worlds.map((w) => {
      const ids = c.lessonOrder
        .filter((l) => l.worldId === w.id)
        .map((l) => l.id);
      const completed = ids.filter((id) => states[id] === "completed").length;
      const unlock = c.worldUnlock[w.id];
      return {
        id: w.id,
        state:
          unlock !== null && unlock !== undefined && done < unlock
            ? ("locked" as const)
            : completed === ids.length
              ? ("completed" as const)
              : ("available" as const),
        completed,
        total: ids.length,
      };
    }),
    lessons: c.lessonOrder.map((l) => {
      const p = progress.find((x) => x.lessonId === l.id);
      const last = p?.lastSessionId
        ? sessions.find((x) => x.id === p.lastSessionId)
        : undefined;
      return {
        id: l.id,
        state: states[l.id]!,
        record: p
          ? {
              bestStars: p.bestStars,
              plays: p.completions,
              firstCompletedAt: p.firstCompletedAt,
              lastCompletedAt: p.lastCompletedAt,
              last: last
                ? {
                    stars: last.stars ?? 0,
                    total: last.total,
                    correct: last.correct,
                    firstTry: last.firstTry,
                    newRewards: rewards
                      .filter((r) => r.sessionId === last.id)
                      .map((r) => r.rewardId),
                  }
                : null,
            }
          : null,
      };
    }),
    rewards: [...rewards]
      .sort((a, b) => a.grantedAt.localeCompare(b.grantedAt))
      .map((r) => ({
        id: r.rewardId,
        earnedAt: r.grantedAt,
        reason: r.reason,
      })),
    history,
    inProgress: open ? sessionState(s, c, open) : null,
    mastery: s.mastery
      .filter((m) => m.childId === childId)
      .map((m) => ({
        skillId: m.skillId,
        state: m.state,
        accuracy: m.accuracy,
        evidence: m.evidence,
        lastPracticedAt: m.lastPracticedAt,
      })),
  };
}

/** Port of ensure_daily_plan: stored on first use of the day. */
export function ensureDailyPlan(
  s: DeviceState,
  childId: string,
  date: string,
  proposal: string[],
): { state: DeviceState; lessonIds: string[] } {
  const existing = s.plans.find(
    (p) => p.childId === childId && p.date === date,
  );
  if (existing) return { state: s, lessonIds: existing.lessonIds };
  if (proposal.length < 1) return { state: s, lessonIds: [] };
  // Keep the last 30 days only (plans are suggestions, not history).
  const cutoff = new Date(Date.parse(`${date}T00:00:00Z`) - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const plans = s.plans.filter((p) => p.date >= cutoff);
  const lessonIds = proposal.slice(0, 5);
  return {
    state: { ...s, plans: [...plans, { childId, date, lessonIds }] },
    lessonIds,
  };
}

// ── Placement (port of the Sprint 05 assessment RPCs, D-050) ────────────

const runState = (r: DRun): PlacementRun => ({
  runId: r.id,
  assessmentId: r.assessmentId,
  status: r.status,
  currentIndex: r.currentIndex,
  total: r.total,
  startedAt: r.startedAt,
});

export function startPlacement(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
  restart: boolean,
  now: Date,
): { state: DeviceState; run: PlacementRun } {
  requireChild(s, childId);
  const at = now.toISOString();
  let runs = s.runs;
  let open = runs.find(
    (r) => r.childId === childId && r.status === "in_progress",
  );
  if (open && restart) {
    runs = runs.map((r) =>
      r.id === open!.id
        ? { ...r, status: "abandoned" as const, abandonedAt: at }
        : r,
    );
    open = undefined;
  }
  if (!open) {
    open = {
      id: newId(),
      childId,
      assessmentId: c.placement.id,
      status: "in_progress",
      currentIndex: 0,
      total: c.placement.questions.length,
      startedAt: at,
      completedAt: null,
      abandonedAt: null,
    };
    runs = [...runs, open];
  }
  return { state: { ...s, runs }, run: runState(open) };
}

export function activePlacement(
  s: DeviceState,
  childId: string,
): PlacementRun | null {
  const r = s.runs.find(
    (x) => x.childId === childId && x.status === "in_progress",
  );
  return r ? runState(r) : null;
}

export function submitPlacement(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
  runId: string,
  questionId: string,
  response: unknown,
  now: Date,
): { state: DeviceState; nextAction: "continue" | "complete" } {
  requireChild(s, childId);
  const run =
    s.runs.find((r) => r.id === runId && r.childId === childId) ??
    fail("forbidden");
  if (run.status !== "in_progress") fail("run_not_active");
  const q = c.placement.questions[run.currentIndex];
  if (!q || q.id !== questionId) fail("question_mismatch");
  const info = c.info(questionId) ?? fail("question_unavailable");
  const g = gradeResponse(q!, info.key, response);
  if (!g.valid) fail("invalid_response");
  const at = now.toISOString();
  const nextIndex = run.currentIndex + 1;
  const complete = nextIndex >= run.total;
  return {
    state: {
      ...s,
      runAnswers: [
        ...s.runAnswers,
        {
          runId,
          childId,
          questionId,
          response,
          isCorrect: g.score === g.maxScore,
          createdAt: at,
        },
      ],
      runs: s.runs.map((r) =>
        r.id === runId
          ? {
              ...r,
              currentIndex: nextIndex,
              status: complete ? ("completed" as const) : r.status,
              completedAt: complete ? at : null,
            }
          : r,
      ),
    },
    nextAction: complete ? "complete" : "continue",
  };
}

export function observationBand(correct: number, items: number) {
  if (items <= 0) return "not_started" as const;
  if (correct === items) return "confident" as const;
  if (correct * 2 >= items) return "developing" as const;
  return "exploring" as const;
}

export function placementSummary(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
): AssessmentSummary | null {
  const run = s.runs
    .filter((r) => r.childId === childId && r.status === "completed")
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))[0];
  if (!run) return null;
  const answers = s.runAnswers.filter((a) => a.runId === run.id);
  const byWorld = new Map<string, { items: number; correct: number }>();
  for (const a of answers) {
    const w = c.info(a.questionId)?.worldId;
    if (!w) continue;
    const v = byWorld.get(w) ?? { items: 0, correct: 0 };
    byWorld.set(w, {
      items: v.items + 1,
      correct: v.correct + (a.isCorrect ? 1 : 0),
    });
  }
  return {
    runId: run.id,
    assessmentId: run.assessmentId,
    title: c.placement.title,
    startedAt: run.startedAt,
    completedAt: run.completedAt!,
    items: run.total,
    modules: c.catalog.worlds
      .filter((w) => byWorld.has(w.id))
      .map((w) => {
        const v = byWorld.get(w.id)!;
        return {
          moduleId: w.id,
          ...v,
          band: observationBand(v.correct, v.items),
        };
      }),
  };
}

// ── Parent report (port of public.get_child_report, D-051) ──────────────

export function childReport(
  s: DeviceState,
  c: DeviceContent,
  childId: string,
  now: Date,
): ChildReport {
  const child = requireChild(s, childId, false);
  const sessions = s.sessions.filter((x) => x.childId === childId);
  const attempts = s.attempts
    .filter((a) => a.childId === childId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Active time: gaps between a session's start and its answers, each ≤ 3 min.
  const perSession = new Map<string, number>();
  const gaps: Array<{ sessionId: string; secs: number; at: string }> = [];
  const lastAt = new Map<string, number>();
  for (const a of attempts) {
    const start =
      lastAt.get(a.sessionId) ??
      Date.parse(
        sessions.find((x) => x.id === a.sessionId)?.startedAt ?? a.createdAt,
      );
    const t = Date.parse(a.createdAt);
    const secs = Math.max(0, Math.min((t - start) / 1000, 180));
    lastAt.set(a.sessionId, t);
    gaps.push({ sessionId: a.sessionId, secs, at: a.createdAt });
    perSession.set(a.sessionId, (perSession.get(a.sessionId) ?? 0) + secs);
  }
  const today = dateKeyIn(now);
  const days = Array.from({ length: 7 }, (_, i) =>
    dateKeyIn(
      new Date(Date.parse(`${today}T12:00:00Z`) - (6 - i) * 86_400_000),
    ),
  );
  const last7 = days.map((date) => {
    const g = gaps.filter((x) => dateKeyIn(new Date(x.at)) === date);
    return {
      date,
      sessions: new Set(g.map((x) => x.sessionId)).size,
      seconds: Math.floor(g.reduce((t, x) => t + x.secs, 0)),
    };
  });
  const progress = s.progress.filter((p) => p.childId === childId);
  const worldOf = new Map(c.lessonOrder.map((l) => [l.id, l.worldId]));

  return {
    child: { id: child.id, nickname: child.nickname, status: child.status },
    totals: {
      sessionsCompleted: sessions.filter((x) => x.status === "completed")
        .length,
      activeSeconds: Math.floor(
        [...perSession.values()].reduce((t, v) => t + v, 0),
      ),
      lessonsCompleted: progress.length,
      stars: progress.reduce((t, p) => t + p.bestStars, 0),
      badges: s.rewards.filter((r) => r.childId === childId).length,
      activeDays7: last7.filter((d) => d.sessions > 0).length,
    },
    last7,
    modules: c.catalog.worlds.map((w) => {
      const mine = progress.filter((p) => worldOf.get(p.lessonId) === w.id);
      return {
        moduleId: w.id,
        total: c.lessonOrder.filter((l) => l.worldId === w.id).length,
        completed: mine.length,
        stars: mine.reduce((t, p) => t + p.bestStars, 0),
        lastAt:
          mine
            .map((p) => p.lastCompletedAt)
            .sort()
            .at(-1) ?? null,
      };
    }),
    skills: c.catalog.worlds.flatMap((w) =>
      w.skills.map((sk) => {
        const m = s.mastery.find(
          (x) => x.childId === childId && x.skillId === sk.id,
        );
        return {
          skillId: sk.id,
          state: m?.state ?? "not_started",
          accuracy: m?.accuracy ?? 0,
          evidence: m?.evidence ?? 0,
          sessions: m?.sessions ?? 0,
          lastPracticedAt: m?.lastPracticedAt ?? null,
        };
      }),
    ),
    recent: sessions
      .filter((x) => x.status === "completed")
      .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
      .slice(0, 20)
      .map((x) => ({
        sessionId: x.id,
        lessonId: x.lessonId,
        completedAt: x.completedAt!,
        activeSeconds: Math.floor(perSession.get(x.id) ?? 0),
        correct: x.correct,
        firstTry: x.firstTry,
        total: x.total,
        stars: x.stars ?? 0,
      })),
    assessment: placementSummary(s, c, childId),
  };
}
