"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo } from "react";

import {
  type LearningRuntime,
  LearningRuntimeProvider,
} from "@/features/learning/runtime";
import type { Reveal } from "@/features/learning/types";

import { deviceContent } from "./content";
import * as E from "./engine";
import { getDeviceState, requestPersistence, updateDevice } from "./store";

/** Parent-gate pass, remembered for 30 minutes in this tab. */
const PARENT_KEY = "little.parent-access";
const PARENT_TTL = 30 * 60_000;

const accessListeners = new Set<() => void>();
const notifyAccess = () => accessListeners.forEach((l) => l());
export function subscribeParentAccess(l: () => void) {
  accessListeners.add(l);
  return () => accessListeners.delete(l);
}

export function grantParentAccess() {
  try {
    sessionStorage.setItem(PARENT_KEY, String(Date.now() + PARENT_TTL));
  } catch {
    // ignore: the gate will simply ask again
  }
  notifyAccess();
}
export function hasParentAccess(): boolean {
  try {
    return Number(sessionStorage.getItem(PARENT_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}
export function revokeParentAccess() {
  try {
    sessionStorage.removeItem(PARENT_KEY);
  } catch {
    // ignore
  }
  notifyAccess();
}

const code = (e: unknown) =>
  e instanceof E.EngineError ? e.code : "unexpected_error";

function selectedChild(): string {
  const id = getDeviceState().selectedChildId;
  if (!id) throw new E.EngineError("forbidden");
  return id;
}

/** Device edition: every learning action runs on this device (no server). */
export function DeviceRuntimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  useEffect(() => requestPersistence(), []);

  const runtime = useMemo<LearningRuntime>(() => {
    const c = deviceContent();
    return {
      edition: "device",
      async startLesson({ lessonId, restart }) {
        try {
          const child = selectedChild();
          updateDevice((s) => {
            const r = E.startSession(
              s,
              c,
              child,
              lessonId,
              restart,
              new Date(),
            );
            return { state: r.state, result: null };
          });
        } catch (e) {
          return { ok: false, code: code(e) };
        }
        router.push(`/student/lessons/${lessonId}/play`);
      },
      async submitAnswer({ sessionId, questionId, response }) {
        try {
          const child = selectedChild();
          const o = updateDevice((s) => {
            const r = E.submitAttempt(
              s,
              c,
              child,
              sessionId,
              questionId,
              response,
              new Date(),
            );
            return { state: r.state, result: r.outcome };
          });
          return {
            ok: true,
            correct: o.isCorrect,
            final: !o.canRetry,
            message: o.feedback.text,
            reveal: (o.reveal ?? undefined) as Reveal | undefined,
            nextAction: o.nextAction,
          };
        } catch (e) {
          return { ok: false, code: code(e) };
        }
      },
      async requestHint({ sessionId, questionId }) {
        try {
          const h = E.requestHint(
            getDeviceState(),
            c,
            selectedChild(),
            sessionId,
            questionId,
          );
          return {
            ok: true,
            text: h.text,
            eliminateOptionId: h.eliminateOptionId ?? undefined,
          };
        } catch (e) {
          return { ok: false, code: code(e) };
        }
      },
      async markRewardsSeen() {
        const id = getDeviceState().selectedChildId;
        if (!id) return;
        updateDevice((s) => ({
          state: E.markRewardsSeen(s, id, new Date()),
          result: null,
        }));
      },
      async selectChild(childId) {
        try {
          updateDevice((s) => ({
            state: E.selectChild(s, childId),
            result: null,
          }));
        } catch {
          return { ok: false, message: "Không tìm thấy hồ sơ của bé." };
        }
        router.push("/student/home");
      },
      async leaveStudent() {
        updateDevice((s) => ({ state: E.selectChild(s, null), result: null }));
        router.push("/student/profiles");
      },
      async submitPlacement({ runId, questionId, response }) {
        try {
          const child = selectedChild();
          const next = updateDevice((s) => {
            const r = E.submitPlacement(
              s,
              c,
              child,
              runId,
              questionId,
              response,
              new Date(),
            );
            return { state: r.state, result: r.nextAction };
          });
          return { ok: true, nextAction: next };
        } catch (e) {
          return { ok: false, code: code(e) };
        }
      },
      grantParentAccess,
      links: {
        parentHome: "/parent",
        childReport: (id, saved) =>
          `/parent/child?id=${encodeURIComponent(id)}${saved ? `&saved=${saved}` : ""}`,
      },
    };
  }, [router]);

  return (
    <LearningRuntimeProvider runtime={runtime}>
      {children}
    </LearningRuntimeProvider>
  );
}
