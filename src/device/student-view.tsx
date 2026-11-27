"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo } from "react";

import { StudentLoading } from "@/components/student/StudentLoading";
import {
  type StudentView,
  toAvatar,
  toChildProgress,
} from "@/features/learning/backend/overview";
import {
  buildDailyPlan,
  dateKeyIn,
  hourIn,
  starsOnDay,
} from "@/features/learning/progress/calc";
import { StudentProvider } from "@/features/learning/student-context";

import { deviceContent } from "./content";
import * as E from "./engine";
import type { DeviceState } from "./state";
import { updateDevice, useDeviceState } from "./store";

/** Builds the same StudentView the server edition builds (pure). */
export function buildStudentView(
  state: DeviceState,
  childId: string,
  now: Date,
  plannedIds?: string[],
): StudentView {
  const c = deviceContent();
  const child = E.getChild(state, childId)!;
  const ov = E.overview(state, c, childId);
  const today = { date: dateKeyIn(now), hour: hourIn(now) };
  const lessonStates = Object.fromEntries(
    ov.lessons.map((l) => [l.id, l.state]),
  );
  const dailyPlan = plannedIds?.length
    ? { date: today.date, lessonIds: plannedIds }
    : undefined;
  const progress = toChildProgress(ov, c.catalog, dailyPlan);
  return {
    child: {
      id: child.id,
      nickname: child.nickname,
      avatar: toAvatar(child.avatarKey),
      preferences: child.preferences,
    },
    progress,
    worldStates: Object.fromEntries(
      ov.modules.map((m) => [
        m.id,
        { state: m.state, completed: m.completed, total: m.total },
      ]),
    ),
    lessonStates,
    today,
    starsToday: starsOnDay(progress, today.date),
  };
}

/**
 * Device-edition equivalent of the server's requireStudent + loadStudentView:
 * waits for local data, sends the child to profile selection if no profile is
 * selected, then provides the view to the shared student screens.
 */
export function DeviceStudent({
  withDailyPlan = false,
  children,
}: {
  withDailyPlan?: boolean;
  children: (view: StudentView) => ReactNode;
}) {
  const state = useDeviceState();
  const router = useRouter();
  const childId =
    state?.selectedChildId &&
    E.getChild(state, state.selectedChildId)?.status === "active"
      ? state.selectedChildId
      : null;

  useEffect(() => {
    if (state && !childId) router.replace("/student/profiles");
  }, [state, childId, router]);

  const view = useMemo(() => {
    if (!state || !childId) return null;
    const now = new Date();
    let planned: string[] | undefined;
    if (withDailyPlan) {
      const stored = state.plans.find(
        (p) => p.childId === childId && p.date === dateKeyIn(now),
      );
      planned =
        stored?.lessonIds ??
        buildDailyPlan(
          deviceContent().catalog,
          E.lessonStates(state, deviceContent(), childId),
          dateKeyIn(now),
        );
    }
    return buildStudentView(state, childId, now, planned);
  }, [state, childId, withDailyPlan]);

  // Store today's plan once so it stays stable while the child learns.
  useEffect(() => {
    if (!withDailyPlan || !view?.progress.dailyPlan) return;
    const { date, lessonIds } = view.progress.dailyPlan;
    if (
      state?.plans.some((p) => p.childId === view.child.id && p.date === date)
    )
      return;
    updateDevice((s) => {
      const r = E.ensureDailyPlan(s, view.child.id, date, lessonIds);
      return { state: r.state, result: null };
    });
  }, [withDailyPlan, view, state]);

  if (!view) return <StudentLoading />;
  return <StudentProvider view={view}>{children(view)}</StudentProvider>;
}
