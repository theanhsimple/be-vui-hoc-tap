import "server-only";

import { BackendError } from "@/features/learning/backend/student";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  type AssessmentSummary,
  assessmentSummarySchema,
  type ChildReport,
  childReportSchema,
} from "./report-model";

/**
 * Parent dashboard reads. Run as the signed-in guardian; the RPCs check
 * family access in the database (a foreign child id is 'forbidden').
 */

export async function getChildReport(childId: string): Promise<ChildReport> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_child_report", {
    p_child_id: childId,
  });
  if (error) throw new BackendError(error.message);
  return childReportSchema.parse(data);
}

export async function getAssessmentSummary(
  childId: string,
  runId?: string,
): Promise<AssessmentSummary | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_assessment_summary", {
    p_child_id: childId,
    ...(runId ? { p_run_id: runId } : {}),
  });
  if (error) throw new BackendError(error.message);
  return data ? assessmentSummarySchema.parse(data) : null;
}
