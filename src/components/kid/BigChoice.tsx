"use client";

import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "motion/react";
import { type ReactNode, useEffect } from "react";

import { cn } from "@/lib/cn";

import { TONES, type Tone } from "../ui/tones";
import { CheckIcon } from "../ui/icons";
import { BIG_CHOICE_SIZE, type BigChoiceSize } from "./sizes";

/**
 * Note: state highlights use `outline`, because the 3D edge owns `box-shadow`.
 *
 * Visual states of an answer choice (UX spec §5.1):
 * - `idle` / `selected`: normal and chosen-but-not-yet-graded
 * - `correct`: mint glow + check mark (never colour alone)
 * - `tryAgain`: gentle wobble on this item only — no red, no cross
 * - `demonstrate`: pulsing glow showing the right answer after 2 tries
 * - `dimmed`: other choices once the question is resolved
 */
export type ChoiceState =
  "idle" | "selected" | "correct" | "tryAgain" | "demonstrate" | "dimmed";

export const CHOICE_STATES: readonly ChoiceState[] = [
  "idle",
  "selected",
  "correct",
  "tryAgain",
  "demonstrate",
  "dimmed",
];

export interface BigChoiceProps {
  /** Spoken/visual content is the picture; `label` is its accessible Vietnamese name. */
  label: string;
  children: ReactNode;
  state?: ChoiceState;
  size?: BigChoiceSize;
  tone?: Tone;
  disabled?: boolean;
  onSelect?: () => void;
  /** Change this (e.g. attempt number) to replay the try-again wobble while state stays `tryAgain`. */
  feedbackKey?: number;
  className?: string;
}

export function BigChoice({
  label,
  children,
  state = "idle",
  size = "lg",
  tone = "cream",
  disabled,
  onSelect,
  feedbackKey = 0,
  className,
}: BigChoiceProps) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLButtonElement>();

  useEffect(() => {
    if (state !== "tryAgain" || reduce || !scope.current) return;
    void animate(
      scope.current,
      { x: [0, -10, 10, -6, 6, 0] },
      { duration: 0.4 },
    );
  }, [state, feedbackKey, reduce, animate, scope]);

  const px = BIG_CHOICE_SIZE[size];
  const resolved = state === "correct" || state === "dimmed";

  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-pressed={state === "selected" || state === "correct"}
      data-state={state}
      disabled={disabled}
      onClick={resolved ? undefined : onSelect}
      ref={scope}
      style={{ width: px, height: px }}
      whileTap={resolved || disabled ? undefined : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-xl p-4 text-[40px] font-extrabold edge-3d select-none",
        "motion-safe:transition-[translate,box-shadow,opacity] motion-safe:duration-150",
        !resolved && "active:translate-y-1 active:edge-3d-pressed",
        state === "correct"
          ? "bg-mint-300 text-ink-900 [--edge:var(--mint-600)]"
          : TONES[tone],
        state === "selected" && "outline-4 outline-offset-4 outline-sky-600",
        state === "correct" && "outline-4 outline-offset-4 outline-mint-600",
        state === "demonstrate" &&
          "outline-4 outline-offset-4 outline-butter-400",
        state === "dimmed" && "opacity-45",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {children}

      {state === "demonstrate" && !reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl ring-8 ring-butter-300"
          animate={{ scale: [1, 1.08, 1], opacity: [0.9, 0.4, 0.9] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      <AnimatePresence>
        {state === "correct" && (
          <motion.span
            aria-hidden
            className="absolute -top-3 -right-3 grid size-14 place-items-center rounded-full bg-mint-400 text-ink-900 edge-3d [--edge:var(--mint-600)]"
            initial={reduce ? { opacity: 0 } : { scale: 0 }}
            animate={reduce ? { opacity: 1 } : { scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <CheckIcon className="size-8" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
