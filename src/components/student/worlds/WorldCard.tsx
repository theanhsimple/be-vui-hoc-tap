"use client";

import { Check, Lock } from "lucide-react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import Link from "next/link";

import { cardHover, gentleNudge } from "@/design-system/motion/presets";
import type { WorldState } from "@/features/learning/progress/calc";
import type { World } from "@/features/learning/types";
import { useAudio } from "@/lib/audio";
import { cn } from "@/lib/cn";

import { LittleIllustration } from "../../ui/LittleIllustration";

const SURFACE = {
  blue: "bg-blue-50",
  yellow: "bg-yellow-50",
  coral: "bg-coral-50",
  mint: "bg-mint-50",
  lavender: "bg-lavender-50",
} as const;

const BAR = {
  blue: "bg-blue",
  yellow: "bg-yellow",
  coral: "bg-coral",
  mint: "bg-mint",
  lavender: "bg-lavender",
} as const;

export interface WorldCardProps {
  world: World;
  state: WorldState;
  completed: number;
  total: number;
  /** "tile" for the home screen, "card" with description for Explore. */
  variant?: "tile" | "card";
  lockedHint?: string;
}

const MotionLink = motion.create(Link);

/** A learning world entry. Locked worlds explain (and say) how to open them instead of navigating. */
export function WorldCard({
  world,
  state,
  completed,
  total,
  variant = "card",
  lockedHint,
}: WorldCardProps) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const { play, playSfx } = useAudio();
  const locked = state === "locked";
  const pct = total ? Math.round((completed / total) * 100) : 0;
  // Accessible name = the visible text + this status (WCAG 2.5.3: the
  // visible label must be part of the name, so no aria-label override).
  const status = locked ? "Chưa mở." : `Đã học ${completed} trên ${total} bài.`;

  const body = (
    <>
      <span
        className={cn(
          "relative block w-full",
          variant === "tile" ? "px-[10%]" : "px-[14%]",
          locked && "opacity-50 grayscale",
        )}
      >
        <LittleIllustration name={world.illustration} decorative />
        {state === "completed" && (
          <span className="absolute top-0 right-[6%] grid size-10 place-items-center rounded-pill bg-mint text-ink shadow-sm">
            <Check aria-hidden className="size-6" strokeWidth={3} />
          </span>
        )}
        {locked && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-pill bg-surface text-ink-muted shadow-sm">
              <Lock aria-hidden className="size-7" />
            </span>
          </span>
        )}
      </span>
      <span className="flex w-full flex-col items-center gap-1 text-center">
        <span
          className={cn(
            variant === "tile" ? "text-body-lg font-extrabold" : "text-h3",
          )}
        >
          {world.nameVi}
        </span>
        <span className="text-caption text-ink-muted">{world.category}</span>
        <span className="sr-only">{status}</span>
        {variant === "card" && (
          <span className="text-body-sm text-ink-muted">
            {locked ? lockedHint : world.description}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className="mt-auto h-2.5 w-full overflow-hidden rounded-pill bg-surface"
      >
        <span
          className={cn("block h-full rounded-pill", BAR[world.tone])}
          style={{ width: `${pct}%` }}
        />
      </span>
    </>
  );

  const cls = cn(
    "flex h-full w-full flex-col items-center gap-2 rounded-xl p-3 text-ink shadow-sm tablet:p-4",
    SURFACE[world.tone],
    "outline-3 outline-offset-2 outline-transparent focus-visible:outline-focus",
  );

  if (locked) {
    return (
      <motion.button
        ref={scope}
        type="button"
        aria-disabled="true"
        data-state={state}
        className={cn(cls, "cursor-default")}
        onClick={() => {
          playSfx("tap");
          void play({
            text: lockedHint ?? "Thế giới này sẽ mở sau nhé.",
            lang: "vi-VN",
          });
          if (!reduce && scope.current)
            void animate(
              scope.current,
              { x: gentleNudge.x },
              gentleNudge.transition,
            );
        }}
      >
        {body}
      </motion.button>
    );
  }
  return (
    <MotionLink
      href={`/student/worlds/${world.id}`}
      data-state={state}
      className={cls}
      {...cardHover}
    >
      {body}
    </MotionLink>
  );
}
