import type { Metadata } from "next";

import { LessonPlayer } from "@/components/student/lessons/LessonPlayer";
import { contentRepository } from "@/features/learning/content/repository";

import { lessonParams, loadLesson } from "../lesson";

export const generateStaticParams = lessonParams;

export async function generateMetadata({
  params,
}: PageProps<"/student/lessons/[lessonId]/play">): Promise<Metadata> {
  const { lessonId } = await params;
  return { title: loadLesson(lessonId).lesson.title };
}

/** Questions are public content; answer keys stay on the server (grading/actions.ts). */
export default async function LessonPlayPage({
  params,
}: PageProps<"/student/lessons/[lessonId]/play">) {
  const { lessonId } = await params;
  const { lesson, world } = loadLesson(lessonId);
  return (
    <LessonPlayer
      catalog={contentRepository.getCatalog()}
      lesson={lesson}
      world={world}
    />
  );
}
