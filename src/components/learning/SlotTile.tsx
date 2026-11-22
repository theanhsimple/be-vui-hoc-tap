"use client";

import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect } from "react";

import { DURATION, gentleNudge } from "@/design-system/motion/presets";
import { cn } from "@/lib/cn";

import { ItemArt } from "./ItemArt";
import type { ActivityItem } from "./types";

export type SlotState =
  "empty" | "filled" | "active" | "fixed" | "correct" | "tryAgain" | "reveal";

const STATE: Record<SlotState, string> = {
  empty: "border-3 border-dashed border-border-strong bg-surface-muted",
  active: "border-3 border-dashed border-blue-strong bg-blue-50",
  filled: "bg-surface edge-3d [--edge:var(--surface-edge)]",
  fixed: "bg-surface-muted ring-1 ring-border ring-inset",
  correct:
    "bg-mint-50 edge-3d [--edge:var(--mint-edge)] outline-3 outline-mint-strong",
  tryAgain:
    "bg-coral-50 edge-3d [--edge:var(--coral-edge)] outline-3 outline-coral",
  reveal:
    "bg-yellow-50 edge-3d [--edge:var(--yellow-edge)] outline-3 outline-yellow-edge",
};

export interface SlotTileProps {
  /** 1-based position, used for the accessible name. */
  position: number;
  item?: ActivityItem;
  state: SlotState;
  /** Omit for non-interactive slots (given pattern items, reveal). */
  onPress?: () => void;
  feedbackKey?: number;
}

/** A position in a sequence or pattern: empty, filled, given, or graded. */
export function SlotTile({
  position,
  item,
  state,
  onPress,
  feedbackKey = 0,
}: SlotTileProps) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  useEffect(() => {
    if (state === "tryAgain" && !reduce && scope.current)
      void animate(scope.current, { x: gentleNudge.x }, gentleNudge.transition);
  }, [state, feedbackKey, reduce, animate, scope]);

  const cls = cn(
    "relative block aspect-square focus-visible:outline-3 focus-visible:outline-focus w-[clamp(72px,15vw,120px)] shrink-0 rounded-lg outline-offset-2 transition-colors duration-200",
    STATE[state],
  );
  const content = item ? (
    <span className="absolute inset-[12%] grid place-items-center [&>svg]:size-full">
      <ItemArt item={item} />
    </span>
  ) : null;
  const name = item ? `Ô ${position}: ${item.label}` : `Ô ${position}: trống`;

  if (!onPress) {
    return (
      <span role="img" aria-label={name} data-state={state} className={cls}>
        {content}
      </span>
    );
  }
  return (
    <motion.button
      ref={scope}
      type="button"
      aria-label={item ? `${name}. Chạm để bỏ ra` : name}
      aria-pressed={state === "active"}
      data-state={state}
      onClick={onPress}
      whileTap={{ scale: 0.96, transition: { duration: DURATION.press } }}
      className={cls}
    >
      {content}
    </motion.button>
  );
}
