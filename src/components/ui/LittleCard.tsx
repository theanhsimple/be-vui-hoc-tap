"use client";

import { type HTMLMotionProps, motion } from "motion/react";
import { type HTMLAttributes, forwardRef } from "react";

import { cardHover } from "@/design-system/motion/presets";
import type { BrandTone } from "@/design-system/tokens";
import { cn } from "@/lib/cn";

const SURFACE: Record<"surface" | "canvas" | "muted" | BrandTone, string> = {
  surface: "bg-surface",
  canvas: "bg-canvas",
  muted: "bg-surface-muted",
  blue: "bg-blue-50",
  yellow: "bg-yellow-50",
  coral: "bg-coral-50",
  mint: "bg-mint-50",
  lavender: "bg-lavender-50",
};

const PADDING = { none: "", sm: "p-4", md: "p-6", lg: "p-8" } as const;
const ELEVATION = {
  none: "",
  xs: "shadow-xs",
  sm: "shadow-sm",
  md: "shadow-md",
} as const;

export type CardSurface = keyof typeof SURFACE;

export interface LittleCardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
  padding?: keyof typeof PADDING;
  elevation?: keyof typeof ELEVATION;
}

/** Static content container. For a tappable card use LittleSelectableCard. */
export function LittleCard({
  surface = "surface",
  padding = "md",
  elevation = "sm",
  className,
  ...rest
}: LittleCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg text-ink",
        SURFACE[surface],
        PADDING[padding],
        ELEVATION[elevation],
        className,
      )}
      {...rest}
    />
  );
}

export interface LittleSelectableCardProps extends HTMLMotionProps<"button"> {
  selected?: boolean;
  padding?: keyof typeof PADDING;
}

/**
 * Tappable card with Default / Hover / Selected / Active (pressed) / Disabled states.
 * Selection is shown by outline + tint + aria-pressed, never colour alone.
 */
export const LittleSelectableCard = forwardRef<
  HTMLButtonElement,
  LittleSelectableCardProps
>(function LittleSelectableCard(
  {
    selected = false,
    padding = "md",
    disabled,
    type = "button",
    className,
    ...rest
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-pressed={selected}
      data-selected={selected || undefined}
      {...(disabled ? {} : cardHover)}
      className={cn(
        "rounded-lg text-left text-ink shadow-sm transition-[background-color,box-shadow,outline-color] duration-200 ease-standard",
        "outline-3 outline-offset-2 outline-transparent hover:shadow-md focus-visible:outline-focus",
        selected ? "bg-blue-50 outline-blue-strong" : "bg-surface",
        "disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-ink disabled:shadow-none",
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  );
});
