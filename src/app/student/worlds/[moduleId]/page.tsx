import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StudentLoading } from "@/components/student/StudentLoading";
import { WorldDetailScreen } from "@/components/student/worlds/WorldDetailScreen";
import { findWorld } from "@/features/learning/content/catalog";
import { getCatalog } from "@/features/learning/backend/content";
import { loadStudentView } from "@/features/learning/backend/student";
import { StudentProvider } from "@/features/learning/student-context";

export const metadata: Metadata = { title: "Thế giới" };

export default function WorldPage({
  params,
}: PageProps<"/student/worlds/[moduleId]">) {
  return (
    <Suspense fallback={<StudentLoading />}>
      <WorldData params={params} />
    </Suspense>
  );
}

async function WorldData({
  params,
}: Pick<PageProps<"/student/worlds/[moduleId]">, "params">) {
  const { moduleId } = await params;
  const catalog = await getCatalog();
  const world = findWorld(catalog, moduleId);
  if (!world) notFound();
  const view = await loadStudentView(`/student/worlds/${moduleId}`);
  return (
    <StudentProvider view={view}>
      <WorldDetailScreen world={world} />
    </StudentProvider>
  );
}
