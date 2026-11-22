import type { Transition, Variants } from "motion/react";

/**
 * Motion presets (docs/DESIGN_SYSTEM.md §10). Durations in seconds for Motion.
 *
 * Principles: natural easing, small distances, soft scale, no bouncing,
 * no constant background movement. MotionConfig reducedMotion="user" (see
 * app/providers.tsx) turns transform animations off for users who ask;
 * opacity changes remain so feedback is still visible.
 */
export const DURATION = {
  press: 0.12,
  hover: 0.2,
  modal: 0.28,
  page: 0.3,
  feedback: 0.35,
  reward: 0.7,
} as const;

export const EASE = {
  standard: [0.2, 0, 0, 1],
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const satisfies Record<string, [number, number, number, number]>;

const t = (
  duration: number,
  ease: readonly number[] = EASE.out,
): Transition => ({
  duration,
  ease: ease as [number, number, number, number],
});

/** Shared variant names: hidden → visible (→ exit). */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: t(DURATION.page) },
  exit: { opacity: 0, transition: t(DURATION.hover) },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: t(DURATION.page) },
  exit: { opacity: 0, y: 8, transition: t(DURATION.hover) },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: t(DURATION.modal) },
  exit: { opacity: 0, scale: 0.98, transition: t(DURATION.hover) },
};

/** Card hover lift (desktop pointers) and press. Spread onto motion elements. */
export const cardHover = {
  whileHover: { y: -2, transition: t(DURATION.hover) },
  whileTap: { y: 1, scale: 0.99, transition: t(DURATION.press) },
} as const;

/** Button press: quick, small squash. */
export const buttonPress = {
  whileTap: { scale: 0.97, transition: t(DURATION.press) },
} as const;

/** Correct answer: a single soft grow-and-settle (no bounce). */
export const successFeedback: Variants = {
  idle: { scale: 1 },
  success: {
    scale: [1, 1.04, 1],
    transition: t(DURATION.feedback),
  },
};

/** Gentle "try again": one short sideways nudge on the chosen item only. */
export const gentleNudge: { x: number[]; transition: Transition } = {
  x: [0, -6, 6, -3, 0],
  transition: { duration: DURATION.feedback, ease: "easeInOut" },
};

/** Reward reveal: container staggers children (~0.7s total). */
export const rewardReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

export const rewardItem: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: t(0.4) },
};

export const MOTION_PRESETS = [
  { name: "fadeIn", duration: "300ms", use: "Content appearing" },
  { name: "fadeUp", duration: "300ms", use: "Page and section entrance" },
  { name: "scaleIn", duration: "280ms", use: "Modal entrance" },
  {
    name: "cardHover",
    duration: "200ms",
    use: "Interactive card hover (pointer devices)",
  },
  { name: "buttonPress", duration: "120ms", use: "Every pressable control" },
  { name: "successFeedback", duration: "350ms", use: "Correct answer" },
  {
    name: "gentleNudge",
    duration: "350ms",
    use: "Try-again on the chosen item",
  },
  {
    name: "rewardReveal",
    duration: "≈700ms",
    use: "Stars and stickers at session end",
  },
] as const;
