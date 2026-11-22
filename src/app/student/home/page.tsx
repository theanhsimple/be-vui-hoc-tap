import type { Metadata } from "next";
import { Suspense } from "react";

import { HomeScreen } from "@/components/student/home/HomeScreen";
import { StudentLoading } from "@/components/student/StudentLoading";
import { getCatalog } from "@/features/learning/backend/content";
import { loadStudentView } from "@/features/learning/backend/student";
import { StudentProvider } from "@/features/learning/student-context";

export const metadata: Metadata = { title: "Trang chủ" };

export default function StudentHomePage() {
  return (
    <Suspense fallback={<StudentLoading />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const [view, catalog] = await Promise.all([
    loadStudentView("/student/home", true),
    getCatalog(),
  ]);
  return (
    <StudentProvider view={view}>
      <HomeScreen catalog={catalog} />
    </StudentProvider>
  );
}
