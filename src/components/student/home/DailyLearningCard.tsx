import { ArrowRight, Clock, Puzzle } from "lucide-react";

import { allLessons, findWorld } from "@/features/learning/content/repository";
import { dateKey } from "@/features/learning/progress/calc";
import type { ChildProgress } from "@/features/learning/progress/model";
import type { Catalog } from "@/features/learning/types";

import { LearningProgress } from "../../learning/LearningProgress";
import { LittleMascot } from "../../learning/LittleMascot";
import { LittleLinkButton } from "../../ui/LittleLinkButton";
import { cn } from "@/lib/cn";
import { VisualView } from "../VisualView";

/** Today's suggested lessons (≈15 minutes). No streaks, no penalties. */
export function DailyLearningCard({
  catalog,
  progress,
  planIds,
  today,
}: {
  catalog: Catalog;
  progress: ChildProgress;
  planIds: string[];
  today: string;
}) {
  const lessons = allLessons(catalog);
  const plan = planIds
    .map((id) => lessons.find((l) => l.id === id))
    .filter((l) => l !== undefined);
  const doneToday = (id: string) => {
    const r = progress.lessons[id];
    return !!r && dateKey(new Date(r.lastCompletedAt)) === today;
  };
  const completed = plan.filter((l) => doneToday(l.id)).length;
  const next = plan.find((l) => !doneToday(l.id));
  const minutes = plan.reduce((m, l) => m + l.minutes, 0);
  const activities = plan.reduce((n, l) => n + l.questionCount, 0);
  const theme = [
    ...new Set(plan.map((l) => findWorld(catalog, l.worldId)?.category)),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      aria-labelledby="daily-title"
      className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-sm tablet:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-bold text-ink-muted">
            Hôm nay học gì?
          </p>
          <h2 id="daily-title" className="text-h1">
            {theme || "Bài học hôm nay"}
          </h2>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-body text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="size-5" /> {minutes} phút
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Puzzle aria-hidden className="size-5" /> {activities} hoạt động
            </span>
          </p>
        </div>
        <LittleMascot
          state={next ? "idle" : "cheer"}
          className="size-20 shrink-0 tablet:size-24"
        />
      </div>

      <ul className="grid grid-cols-3 gap-3">
        {plan.map((l) => (
          <li
            key={l.id}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg bg-surface-muted p-2 text-center",
              doneToday(l.id) && "bg-mint-50",
            )}
          >
            <span className="w-14 tablet:w-16">
              <VisualView visual={l.cover} />
            </span>
            <span className="line-clamp-2 text-body-sm font-bold">
              {l.title}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <LearningProgress
          total={Math.max(plan.length, 1)}
          current={completed}
        />
        {next ? (
          <LittleLinkButton
            href={`/student/lessons/${next.id}`}
            size="xl"
            iconEnd={<ArrowRight strokeWidth={3} />}
          >
            {completed === 0 ? "Bắt đầu học" : "Học bài tiếp theo"}
          </LittleLinkButton>
        ) : (
          <p className="text-h3 text-success-strong">
            Con đã học xong bài hôm nay. Tuyệt vời!
          </p>
        )}
      </div>
    </section>
  );
}
