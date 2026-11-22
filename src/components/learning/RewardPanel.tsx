"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { rewardItem, rewardReveal } from "@/design-system/motion/presets";
import type { IllustrationName } from "@/illustrations/registry";
import { cn } from "@/lib/cn";

import { LittleIllustration } from "../ui/LittleIllustration";

export interface RewardPanelProps {
  title: string;
  starsEarned: number;
  maxStars?: number;
  /** Sticker added to the sticker book, if any. */
  sticker?: { illustration: IllustrationName; label: string };
  action?: ReactNode;
  className?: string;
}

/** End-of-session celebration: stars and sticker reveal in ≈700 ms, then still. */
export function RewardPanel({
  title,
  starsEarned,
  maxStars = 3,
  sticker,
  action,
  className,
}: RewardPanelProps) {
  const earned = Math.min(Math.max(starsEarned, 0), maxStars);
  return (
    <motion.section
      aria-label={`${title}. Được ${earned} trên ${maxStars} ngôi sao`}
      variants={rewardReveal}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center gap-5 rounded-xl bg-yellow-50 p-6 text-center shadow-sm tablet:p-8",
        className,
      )}
    >
      <motion.h2 variants={rewardItem} className="text-h1">
        {title}
      </motion.h2>
      <div aria-hidden className="flex items-end gap-2 tablet:gap-4">
        {Array.from({ length: maxStars }, (_, i) => {
          const big = maxStars === 3 && i === 1;
          return (
            <motion.span
              key={i}
              variants={rewardItem}
              className={
                big ? "size-24 tablet:size-28" : "size-18 tablet:size-20"
              }
            >
              {i < earned ? (
                <LittleIllustration name="shape.star" decorative />
              ) : (
                <Star
                  className="size-full p-2 text-surface-edge"
                  strokeWidth={1.5}
                />
              )}
            </motion.span>
          );
        })}
      </div>
      {sticker && (
        <motion.div
          variants={rewardItem}
          className="flex flex-col items-center gap-1"
        >
          <LittleIllustration
            name={sticker.illustration}
            size={88}
            alt={sticker.label}
          />
          <span className="text-body-lg text-ink-muted">{sticker.label}</span>
        </motion.div>
      )}
      {action && (
        <motion.div
          variants={rewardItem}
          className="flex flex-wrap justify-center gap-3"
        >
          {action}
        </motion.div>
      )}
    </motion.section>
  );
}
