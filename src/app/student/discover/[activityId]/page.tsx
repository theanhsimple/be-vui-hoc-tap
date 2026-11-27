import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { PlacementPlayer } from "@/components/student/discover/PlacementPlayer";
import { StudentLoading } from "@/components/student/StudentLoading";
import { getPlacement } from "@/features/learning/backend/content";
import {
  getActivePlacement,
  loadStudentView,
} from "@/features/learning/backend/student";
import { StudentProvider } from "@/features/learning/student-context";

export const metadata: Metadata = { title: "Cùng khám phá" };

/**
 * Renders an EXISTING placement run (started by a parent on the child's
 * page) — opening this URL never creates data.
 */
export default function DiscoverPage({
  params,
}: PageProps<"/student/discover/[activityId]">) {
  return (
    <Suspense fallback={<StudentLoading />}>
      <Discover params={params} />
    </Suspense>
  );
}

async function Discover({
  params,
}: Pick<PageProps<"/student/discover/[activityId]">, "params">) {
  const { activityId } = await params;
  const activity = await getPlacement(activityId);
  if (!activity) notFound();
  const view = await loadStudentView(`/student/discover/${activityId}`);
  const run = await getActivePlacement(view.child.id, activityId);
  if (!run) redirect("/student/home");
  return (
    <StudentProvider view={view}>
      <PlacementPlayer
        key={run.runId}
        run={run}
        questions={activity.questions}
        childId={view.child.id}
      />
    </StudentProvider>
  );
}
