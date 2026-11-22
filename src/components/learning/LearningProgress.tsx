import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

export interface LearningProgressProps {
  /** Steps (questions) in the session. */
  total: number;
  /** Current step, 0-based. Steps before it are done. Use `total` when finished. */
  current: number;
  className?: string;
}

/**
 * Session progress as stepping stones — no numbers for the child.
 * Exposed to assistive tech as a progressbar. Static (no pulsing).
 */
export function LearningProgress({
  total,
  current,
  className,
}: LearningProgressProps) {
  const done = Math.min(Math.max(current, 0), total);
  return (
    <div
      role="progressbar"
      aria-label="Tiến độ bài học"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={
        done >= total ? "Đã xong" : `Câu ${done + 1} trên ${total}`
      }
      className={cn("flex items-center gap-0.5 tablet:gap-1", className)}
    >
      {Array.from({ length: total }, (_, i) => {
        const status = i < done ? "done" : i === done ? "current" : "upcoming";
        return (
          <div key={i} className="flex items-center gap-0.5 tablet:gap-1">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-2 rounded-pill tablet:w-5",
                  i <= done ? "bg-mint" : "bg-border",
                )}
              />
            )}
            <span
              aria-hidden
              data-status={status}
              className={cn(
                "grid place-items-center rounded-pill edge-3d transition-[width,height,background-color] duration-300 [--edge-depth:3px] motion-reduce:transition-none",
                status === "done" &&
                  "size-7 bg-mint text-ink [--edge:var(--mint-edge)] tablet:size-8",
                status === "current" &&
                  "size-9 bg-yellow ring-4 ring-yellow-50 [--edge:var(--yellow-edge)] tablet:size-10",
                status === "upcoming" &&
                  "size-6 bg-surface [--edge:var(--surface-edge)] tablet:size-7",
              )}
            >
              {status === "done" && (
                <Check className="size-4" strokeWidth={3} />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
