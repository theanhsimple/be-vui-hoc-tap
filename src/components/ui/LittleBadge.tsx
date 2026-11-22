import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export const BADGE_TONES = {
  neutral: "bg-surface-muted text-ink-muted ring-1 ring-border ring-inset",
  info: "bg-blue-50 text-blue-strong",
  success: "bg-success-50 text-success-strong",
  warning: "bg-warning-50 text-warning-strong",
  attention: "bg-coral-50 text-coral-strong",
  reward: "bg-yellow-50 text-yellow-strong",
  creative: "bg-lavender-50 text-lavender-strong",
  error: "bg-error-50 text-error-strong",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export interface LittleBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  icon?: ReactNode;
}

/** Short status label. Always text (+ optional icon), never colour alone. */
export function LittleBadge({
  tone = "neutral",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: LittleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill font-bold whitespace-nowrap",
        size === "sm"
          ? "px-2 py-0.5 text-caption [&_svg]:size-3"
          : "px-3 py-1 text-body-sm [&_svg]:size-4",
        BADGE_TONES[tone],
        className,
      )}
      {...rest}
    >
      {icon && (
        <span aria-hidden className="contents">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
