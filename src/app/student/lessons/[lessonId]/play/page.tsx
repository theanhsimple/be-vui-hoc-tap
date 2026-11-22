import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LessonPlayer } from "@/components/student/lessons/LessonPlayer";
import { StudentLoading } from "@/components/student/StudentLoading";
import {
  getActiveSession,
  loadStudentView,
} from "@/features/learning/backend/student";
import { StudentProvider } from "@/features/learning/student-context";

import { loadLesson } from "../../../_data/lesson";

export const metadata: Metadata = { title: "Đang học" };

/**
 * The player renders an EXISTING session (created by "Cùng học nhé!" on the
 * intro screen) — opening this URL never creates data. Questions are public
 * content; answer keys never leave the database.
 */
export default function LessonPlayPage({
  params,
}: PageProps<"/student/lessons/[lessonId]/play">) {
  return (
    <Suspense fallback={<StudentLoading />}>
      <Play params={params} />
    </Suspense>
  );
}

async function Play({
  params,
}: Pick<PageProps<"/student/lessons/[lessonId]/play">, "params">) {
  const { lessonId } = await params;
  const { lesson, world } = await loadLesson(lessonId);
  const view = await loadStudentView(`/student/lessons/${lessonId}/play`);
  const session = await getActiveSession(view.child.id, lessonId);
  if (!session) redirect(`/student/lessons/${lessonId}`);
  return (
    <StudentProvider view={view}>
      <LessonPlayer
        key={session.sessionId}
        lesson={lesson}
        world={world}
        session={session}
      />
    </StudentProvider>
  );
}
