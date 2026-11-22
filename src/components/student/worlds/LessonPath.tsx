"use client";

import { Check, Lock, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { DURATION } from "@/design-system/motion/presets";
import type { BrandTone } from "@/design-system/tokens";
import type { LessonState } from "@/features/learning/progress/calc";
import type { LessonSummary } from "@/features/learning/types";
import { useAudio } from "@/lib/audio";
import { cn } from "@/lib/cn";

import { VisualView } from "../VisualView";

const NODE = {
  blue: "border-blue [--edge:var(--blue-edge)]",
  yellow: "border-yellow [--edge:var(--yellow-edge)]",
  coral: "border-coral [--edge:var(--coral-edge)]",
  mint: "border-mint [--edge:var(--mint-edge)]",
  lavender: "border-lavender [--edge:var(--lavender-edge)]",
} as const;

export interface PathStop {
  lesson: LessonSummary;
  state: LessonState;
  stars: number;
}

/**
 * Lessons as stepping stones on a gently winding path (not a table).
 * Available stones are tappable; locked stones explain themselves by voice.
 */
export function LessonPath({
  lessons,
  tone,
  onOpen,
}: {
  lessons: PathStop[];
  tone: BrandTone;
  onOpen: (lessonId: string) => void;
}) {
  const { play, playSfx } = useAudio();
  const reduce = useReducedMotion();
  return (
    <ol className="relative flex flex-wrap items-start gap-x-6 gap-y-8 rounded-xl bg-surface/70 px-4 py-6 tablet:gap-x-12 tablet:px-8">
      {lessons.map(({ lesson, state, stars }, i) => {
        const locked = state === "locked";
        const label = `${lesson.title}. ${locked ? "Chưa mở." : state === "completed" ? `Đã học, ${stars} sao.` : "Sẵn sàng."}`;
        return (
          <li
            key={lesson.id}
            className={cn(
              "flex w-36 flex-col items-center gap-2 tablet:w-44",
              i % 2 === 1 && "tablet:mt-10",
            )}
          >
            <motion.button
              type="button"
              aria-label={label}
              aria-disabled={locked || undefined}
              data-state={state}
              whileTap={
                locked || reduce
                  ? undefined
                  : { scale: 0.96, transition: { duration: DURATION.press } }
              }
              onClick={() => {
                playSfx("tap");
                if (locked) {
                  void play({
                    text: "Con học xong bài trước để mở bài này nhé.",
                    lang: "vi-VN",
                  });
                  return;
                }
                onOpen(lesson.id);
              }}
              className={cn(
                "relative grid size-28 place-items-center rounded-pill border-6 edge-3d [--edge-depth:5px] tablet:size-32",
                "outline-3 outline-offset-4 outline-transparent focus-visible:outline-focus",
                locked
                  ? "cursor-default border-border bg-disabled [--edge:var(--border)]"
                  : cn("bg-surface", NODE[tone]),
              )}
            >
              <span
                className={cn(
                  "block w-[62%]",
                  locked && "opacity-40 grayscale",
                )}
              >
                <VisualView visual={lesson.cover} />
              </span>
              {locked && (
                <span className="absolute -right-1 -bottom-1 grid size-10 place-items-center rounded-pill bg-surface text-ink-muted shadow-sm">
                  <Lock aria-hidden className="size-5" />
                </span>
              )}
              {state === "completed" && (
                <span className="absolute -top-1 -right-1 grid size-10 place-items-center rounded-pill bg-mint text-ink shadow-sm">
                  <Check aria-hidden className="size-5" strokeWidth={3} />
                </span>
              )}
            </motion.button>
            <span aria-hidden className="flex gap-0.5">
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "size-5",
                    n <= stars
                      ? "fill-yellow text-yellow-strong"
                      : "text-surface-edge",
                  )}
                />
              ))}
            </span>
            <span
              className={cn(
                "text-center text-body-lg font-bold",
                locked && "text-ink-muted",
              )}
            >
              {lesson.title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
