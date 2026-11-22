import type { Metadata } from "next";

import { LessonIntroScreen } from "@/components/student/lessons/LessonIntroScreen";

import { lessonParams, loadLesson } from "./lesson";

export const generateStaticParams = lessonParams;

export async function generateMetadata({
  params,
}: PageProps<"/student/lessons/[lessonId]">): Promise<Metadata> {
  const { lessonId } = await params;
  return { title: loadLesson(lessonId).lesson.title };
}

export default async function LessonIntroPage({
  params,
}: PageProps<"/student/lessons/[lessonId]">) {
  const { lessonId } = await params;
  const { lesson, world } = loadLesson(lessonId);
  // Only the summary is sent to the intro screen.
  const { questions: _questions, ...summary } = lesson;
  void _questions;
  return <LessonIntroScreen lesson={summary} world={world} />;
}
