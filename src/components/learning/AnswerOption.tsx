"use client";

import { Check, Sparkles } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "motion/react";
import { type ReactNode, useEffect } from "react";

import {
  DURATION,
  EASE,
  gentleNudge,
  scaleIn,
} from "@/design-system/motion/presets";
import { cn } from "@/lib/cn";

import type { AnswerState } from "./types";

/** Responsive square sizes; the smallest (mobile) is still well above the 64 px child target. */
export const ANSWER_SIZE = {
  md: { min: 96, vw: 22, max: 144 },
  lg: { min: 92, vw: 24, max: 184 },
  xl: { min: 112, vw: 28, max: 216 },
} as const;

export type AnswerSize = keyof typeof ANSWER_SIZE;

const STATE_CLASSES: Record<AnswerState, string> = {
  idle: "bg-surface [--edge:var(--surface-edge)]",
  selected: "bg-blue-50 [--edge:var(--blue-edge)] outline-blue-strong",
  correct: "bg-mint-50 [--edge:var(--mint-edge)] outline-mint-strong",
  tryAgain: "bg-coral-50 [--edge:var(--coral-edge)] outline-coral",
  reveal: "bg-yellow-50 [--edge:var(--yellow-edge)] outline-yellow-edge",
  dimmed: "bg-surface [--edge:var(--surface-edge)] opacity-50",
};

export interface AnswerOptionProps {
  /** Accessible Vietnamese name — the content itself is visual. */
  label: string;
  children: ReactNode;
  state?: AnswerState;
  size?: AnswerSize;
  disabled?: boolean;
  onSelect?: () => void;
  /** Change (e.g. attempt number) to replay the try-again nudge. */
  feedbackKey?: number;
  className?: string;
}

/**
 * A large, content-agnostic answer tile.
 * correct = mint + check mark; tryAgain = soft coral + one gentle nudge (never red);
 * reveal = sunshine outline + sparkle, used to show the answer after the last try.
 */
export function AnswerOption({
  label,
  children,
  state = "idle",
  size = "lg",
  disabled,
  onSelect,
  feedbackKey = 0,
  className,
}: AnswerOptionProps) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const locked =
    state === "correct" || state === "dimmed" || state === "reveal";
  const s = ANSWER_SIZE[size];

  useEffect(() => {
    if (reduce || !scope.current) return;
    if (state === "tryAgain")
      void animate(scope.current, { x: gentleNudge.x }, gentleNudge.transition);
    if (state === "correct" || state === "reveal")
      void animate(
        scope.current,
        { scale: [1, 1.04, 1] },
        { duration: DURATION.feedback, ease: EASE.out },
      );
  }, [state, feedbackKey, reduce, animate, scope]);

  return (
    <motion.button
      ref={scope}
      type="button"
      aria-label={label}
      aria-pressed={state === "selected" || state === "correct"}
      aria-disabled={locked || undefined}
      data-state={state}
      disabled={disabled}
      onClick={locked ? undefined : onSelect}
      whileTap={
        locked || disabled
          ? undefined
          : { scale: 0.97, transition: { duration: DURATION.press } }
      }
      style={{ width: `clamp(${s.min}px, ${s.vw}vw, ${s.max}px)` }}
      className={cn(
        "relative aspect-square shrink-0 rounded-xl text-display text-ink select-none",
        "edge-3d outline-3 outline-offset-3 outline-transparent transition-[background-color,box-shadow,opacity,outline-color] duration-200 focus-visible:outline-focus",
        !locked &&
          !disabled &&
          "hover:brightness-[1.02] active:translate-y-0.5 active:edge-3d-pressed",
        STATE_CLASSES[state],
        locked && "cursor-default",
        "disabled:cursor-not-allowed disabled:bg-disabled disabled:opacity-60",
        className,
      )}
    >
      <span className="absolute inset-[12%] grid place-items-center [&>svg]:size-full">
        {children}
      </span>
      <AnimatePresence>
        {(state === "correct" || state === "reveal") && (
          <motion.span
            key={state}
            aria-hidden
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "absolute -top-2.5 -right-2.5 grid size-11 place-items-center rounded-pill text-ink shadow-sm tablet:size-12",
              state === "correct" ? "bg-mint" : "bg-yellow",
            )}
          >
            {state === "correct" ? (
              <Check className="size-6" strokeWidth={3} />
            ) : (
              <Sparkles className="size-6" />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
