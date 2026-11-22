import type { Metadata } from "next";
import { Suspense } from "react";

import { LessonIntroScreen } from "@/components/student/lessons/LessonIntroScreen";
import { StudentLoading } from "@/components/student/StudentLoading";
import { loadStudentView } from "@/features/learning/backend/student";
import { StudentProvider } from "@/features/learning/student-context";

import { loadLesson } from "../../_data/lesson";

export const metadata: Metadata = { title: "Bài học" };

export default function LessonIntroPage({
  params,
}: PageProps<"/student/lessons/[lessonId]">) {
  return (
    <Suspense fallback={<StudentLoading />}>
      <Intro params={params} />
    </Suspense>
  );
}

async function Intro({
  params,
}: Pick<PageProps<"/student/lessons/[lessonId]">, "params">) {
  const { lessonId } = await params;
  const { summary, world } = await loadLesson(lessonId);
  const view = await loadStudentView(`/student/lessons/${lessonId}`);
  // Only the summary is sent to the intro screen.
  return (
    <StudentProvider view={view}>
      <LessonIntroScreen lesson={summary} world={world} />
    </StudentProvider>
  );
}
