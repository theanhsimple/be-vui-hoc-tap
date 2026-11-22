"use client";

import { CircleCheck, Lightbulb, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { fadeUp } from "@/design-system/motion/presets";
import { cn } from "@/lib/cn";

import { LittleMascot, type MascotState } from "./LittleMascot";

export type FeedbackKind = "success" | "tryAgain" | "reveal";

const KIND: Record<
  FeedbackKind,
  { cls: string; Icon: typeof CircleCheck; mascot: MascotState }
> = {
  success: { cls: "bg-success-50", Icon: CircleCheck, mascot: "cheer" },
  tryAgain: { cls: "bg-coral-50", Icon: Lightbulb, mascot: "encourage" },
  reveal: { cls: "bg-yellow-50", Icon: Sparkles, mascot: "think" },
};

const ICON_TONE: Record<FeedbackKind, string> = {
  success: "text-success-strong",
  tryAgain: "text-coral-strong",
  reveal: "text-yellow-strong",
};

export interface FeedbackPanelProps {
  kind: FeedbackKind;
  /** Caption of the spoken feedback, e.g. "Đúng rồi! Giỏi quá!". */
  message: string;
  /** Next step, e.g. a "Tiếp tục" button or an AudioPlayer. */
  action?: ReactNode;
  className?: string;
}

/**
 * Feedback after an answer. Positive and calm: success in soft green,
 * try-again as encouragement (never red, never "sai"), reveal shows the way.
 */
export function FeedbackPanel({
  kind,
  message,
  action,
  className,
}: FeedbackPanelProps) {
  const { cls, Icon, mascot } = KIND[kind];
  return (
    <motion.div
      role="status"
      data-kind={kind}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg p-3 tablet:gap-4 tablet:p-4",
        cls,
        className,
      )}
    >
      <LittleMascot
        state={mascot}
        className="size-14 shrink-0 tablet:size-16"
      />
      <p className="flex min-w-0 flex-1 items-center gap-2 text-h3 text-ink">
        <Icon aria-hidden className={cn("size-6 shrink-0", ICON_TONE[kind])} />
        {message}
      </p>
      {action && (
        <div className="flex shrink-0 items-center gap-3">{action}</div>
      )}
    </motion.div>
  );
}
