import type { Metadata } from "next";
import { Suspense } from "react";

import { StudentLoading } from "@/components/student/StudentLoading";
import { ExploreScreen } from "@/components/student/worlds/ExploreScreen";
import { getCatalog } from "@/features/learning/backend/content";
import { loadStudentView } from "@/features/learning/backend/student";
import { StudentProvider } from "@/features/learning/student-context";

export const metadata: Metadata = { title: "Khám phá" };

export default function ExplorePage() {
  return (
    <Suspense fallback={<StudentLoading />}>
      <Explore />
    </Suspense>
  );
}

async function Explore() {
  const [view, catalog] = await Promise.all([
    loadStudentView("/student/explore"),
    getCatalog(),
  ]);
  return (
    <StudentProvider view={view}>
      <ExploreScreen catalog={catalog} />
    </StudentProvider>
  );
}
