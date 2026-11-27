import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { requireUser } from "@/features/auth/session";
import { getSelectedChild } from "@/features/family/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  buildDailyPlan,
  dateKeyIn,
  hourIn,
  starsOnDay,
} from "../progress/calc";
import { getCatalog } from "./content";
import { type PlacementRun, placementRunSchema } from "./placement";
import {
  type Overview,
  overviewSchema,
  type SessionResult,
  sessionResultSchema,
  type SessionState,
  sessionStateSchema,
  type StudentView,
  toChildProgress,
} from "./overview";

/**
 * Student data access (server only). Order of checks on every request:
 * signed-in guardian → selected child cookie re-validated through RLS →
 * child-scoped RPCs, which check family access again in the database.
 */

export class BackendError extends Error {
  constructor(
    readonly code: string,
    message = code,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

/** The signed-in guardian's currently selected child, or a redirect. */
export const requireStudent = cache(async (nextPath: string) => {
  const user = await requireUser(nextPath);
  const child = await getSelectedChild();
  if (!child) redirect("/student/profiles");
  return { user, child };
});

export async function fetchOverview(childId: string): Promise<Overview> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_student_overview", {
    p_child_id: childId,
  });
  if (error) throw new BackendError(error.message);
  return overviewSchema.parse(data);
}

/** Builds the full child view for one request (deduplicated per request). */
export const loadStudentView = cache(
  async (nextPath: string, withDailyPlan = false): Promise<StudentView> => {
    const { child } = await requireStudent(nextPath);
    const [overview, catalog] = await Promise.all([
      fetchOverview(child.id),
      getCatalog(),
    ]);
    const now = new Date();
    const today = { date: dateKeyIn(now), hour: hourIn(now) };
    const lessonStates = Object.fromEntries(
      overview.lessons.map((l) => [l.id, l.state]),
    );

    let dailyPlan: { date: string; lessonIds: string[] } | undefined;
    if (withDailyPlan) {
      const proposal = buildDailyPlan(catalog, lessonStates, today.date);
      if (proposal.length > 0) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.rpc("ensure_daily_plan", {
          p_child_id: child.id,
          p_plan_date: today.date,
          p_lesson_slugs: proposal,
        });
        // A plan is a suggestion: if storing it fails, show the fresh one.
        dailyPlan = {
          date: today.date,
          lessonIds: !error && data ? data : proposal,
        };
      }
    }

    const progress = toChildProgress(overview, catalog, dailyPlan);
    return {
      child: {
        id: child.id,
        nickname: child.nickname,
        avatar: child.avatar,
        preferences: child.preferences,
      },
      progress,
      worldStates: Object.fromEntries(
        overview.modules.map((m) => [
          m.id,
          { state: m.state, completed: m.completed, total: m.total },
        ]),
      ),
      lessonStates,
      today,
      starsToday: starsOnDay(progress, today.date),
    };
  },
);

export async function getActiveSession(
  childId: string,
  lessonId: string,
): Promise<SessionState | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_active_session", {
    p_child_id: childId,
    p_lesson_slug: lessonId,
  });
  if (error) throw new BackendError(error.message);
  return data ? sessionStateSchema.parse(data) : null;
}

/** Authoritative result of one session of the selected child, or null. */
export async function getSessionResult(
  childId: string,
  sessionId: string,
): Promise<SessionResult | null> {
  const supabase = await createSupabaseServerClient();
  // RLS: only sessions of this guardian's family are visible; then pin to
  // the selected child so a URL cannot show a sibling's result.
  const { data: owned } = await supabase
    .from("learning_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("child_id", childId)
    .maybeSingle();
  if (!owned) return null;
  const { data, error } = await supabase.rpc("get_session_result", {
    p_session_id: sessionId,
  });
  if (error) throw new BackendError(error.message);
  return sessionResultSchema.parse(data);
}

export type { PlacementRun };

/** The open placement run of a child (read-only), or null. */
export async function getActivePlacement(
  childId: string,
  activityId: string,
): Promise<PlacementRun | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_active_assessment", {
    p_child_id: childId,
    p_assessment_slug: activityId,
  });
  if (error) throw new BackendError(error.message);
  return data ? placementRunSchema.parse(data) : null;
}
