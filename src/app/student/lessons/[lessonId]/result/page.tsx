import type { Metadata } from "next";

import { LessonResultScreen } from "@/components/student/lessons/LessonResultScreen";

import { lessonParams, loadLesson } from "../lesson";

export const generateStaticParams = lessonParams;

export const metadata: Metadata = { title: "Kết quả" };

export default async function LessonResultPage({
  params,
}: PageProps<"/student/lessons/[lessonId]/result">) {
  const { lessonId } = await params;
  const { lesson, world } = loadLesson(lessonId);
  const { questions: _questions, ...summary } = lesson;
  void _questions;
  return <LessonResultScreen lesson={summary} world={world} />;
}
