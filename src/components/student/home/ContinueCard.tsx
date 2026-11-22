import { Play } from "lucide-react";

import type { LessonSummary } from "@/features/learning/types";

import { LittleLinkButton } from "../../ui/LittleLinkButton";
import { VisualView } from "../VisualView";

/** The unfinished lesson, resumed exactly where the child stopped. */
export function ContinueCard({
  lesson,
  worldName,
  answered,
}: {
  lesson: LessonSummary;
  worldName: string;
  answered: number;
}) {
  return (
    <section
      aria-labelledby="continue-title"
      className="flex flex-wrap items-center gap-4 rounded-xl bg-blue-50 p-4 shadow-sm"
    >
      <span className="w-20 shrink-0">
        <VisualView visual={lesson.cover} />
      </span>
      <div className="min-w-40 flex-1">
        <p className="text-caption text-ink-muted">Học tiếp · {worldName}</p>
        <h2 id="continue-title" className="truncate text-h3">
          {lesson.title}
        </h2>
        <p className="text-body-sm text-ink-muted">
          Đã làm {answered}/{lesson.questionCount} câu
        </p>
      </div>
      <LittleLinkButton
        href={`/student/lessons/${lesson.id}/play`}
        size="lg"
        iconStart={<Play />}
        aria-label={`Học tiếp ${lesson.title}`}
      >
        Học tiếp
      </LittleLinkButton>
    </section>
  );
}
