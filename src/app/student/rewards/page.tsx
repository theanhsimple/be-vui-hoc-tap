import type { Metadata } from "next";
import { Suspense } from "react";

import { RewardsScreen } from "@/components/student/rewards/RewardsScreen";
import { StudentLoading } from "@/components/student/StudentLoading";
import { getCatalog } from "@/features/learning/backend/content";
import { loadStudentView } from "@/features/learning/backend/student";
import { StudentProvider } from "@/features/learning/student-context";

export const metadata: Metadata = { title: "Phần thưởng" };

export default function RewardsPage() {
  return (
    <Suspense fallback={<StudentLoading />}>
      <Rewards />
    </Suspense>
  );
}

async function Rewards() {
  const [view, catalog] = await Promise.all([
    loadStudentView("/student/rewards"),
    getCatalog(),
  ]);
  return (
    <StudentProvider view={view}>
      <RewardsScreen catalog={catalog} />
    </StudentProvider>
  );
}
