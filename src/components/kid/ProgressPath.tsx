"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/cn";

import { CheckIcon } from "../ui/icons";

export interface ProgressPathProps {
  /** Number of steps (questions) in the session. */
  total: number;
  /** Index of the current step, 0-based. Steps before it are done. Use `total` when finished. */
  current: number;
  className?: string;
}

/**
 * Session progress as stepping stones — no numbers for the child.
 * Exposed to assistive tech as a progressbar for adults.
 */
export function ProgressPath({ total, current, className }: ProgressPathProps) {
  const reduce = useReducedMotion();
  const done = Math.min(Math.max(current, 0), total);

  return (
    <div
      role="progressbar"
      aria-label="Tiến độ bài học"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`Câu ${Math.min(done + 1, total)} trên ${total}`}
      className={cn("flex items-center gap-1.5", className)}
    >
      {Array.from({ length: total }, (_, i) => {
        const status = i < done ? "done" : i === done ? "current" : "upcoming";
        return (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-4 rounded-full sm:w-6",
                  i <= done ? "bg-mint-400" : "bg-white/70",
                )}
              />
            )}
            <motion.span
              aria-hidden
              data-status={status}
              className={cn(
                "grid place-items-center rounded-full edge-3d",
                status === "done" &&
                  "size-9 bg-mint-400 text-ink-900 [--edge:var(--mint-600)]",
                status === "current" &&
                  "size-11 bg-butter-400 [--edge:var(--butter-600)]",
                status === "upcoming" &&
                  "size-8 bg-cream-50 [--edge:var(--cream-edge)]",
              )}
              animate={
                status === "current" && !reduce
                  ? { scale: [1, 1.1, 1] }
                  : { scale: 1 }
              }
              transition={
                status === "current" && !reduce
                  ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                  : undefined
              }
            >
              {status === "done" && <CheckIcon className="size-5" />}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}
