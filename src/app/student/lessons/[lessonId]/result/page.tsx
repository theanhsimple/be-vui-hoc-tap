import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";

import {
  type LessonOutcome,
  LessonResultScreen,
} from "@/components/student/lessons/LessonResultScreen";
import { StudentLoading } from "@/components/student/StudentLoading";
import {
  getSessionResult,
  loadStudentView,
} from "@/features/learning/backend/student";
import { StudentProvider } from "@/features/learning/student-context";

import { loadLesson } from "../../../_data/lesson";

export const metadata: Metadata = { title: "Kết quả" };

export default function LessonResultPage(
  props: PageProps<"/student/lessons/[lessonId]/result">,
) {
  return (
    <Suspense fallback={<StudentLoading />}>
      <Result {...props} />
    </Suspense>
  );
}

async function Result({
  params,
  searchParams,
}: PageProps<"/student/lessons/[lessonId]/result">) {
  const { lessonId } = await params;
  const { session } = await searchParams;
  const { summary, world } = await loadLesson(lessonId);
  const view = await loadStudentView(`/student/lessons/${lessonId}/result`);

  // Authoritative result of the session just played (pinned to this child);
  // otherwise the child's latest completed result for this lesson.
  let result: LessonOutcome | null = null;
  const sessionId = z.uuid().safeParse(session);
  if (sessionId.success) {
    const r = await getSessionResult(view.child.id, sessionId.data);
    if (
      r &&
      r.status === "completed" &&
      r.lessonId === lessonId &&
      r.completedAt
    )
      result = { ...r, completedAt: r.completedAt };
  }
  if (!result) {
    const record = view.progress.lessons[lessonId];
    if (record)
      result = { ...record.last, completedAt: record.lastCompletedAt };
  }
  return (
    <StudentProvider view={view}>
      <LessonResultScreen lesson={summary} world={world} result={result} />
    </StudentProvider>
  );
}
