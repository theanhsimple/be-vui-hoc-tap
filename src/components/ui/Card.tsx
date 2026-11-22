import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const SURFACES = {
  cream: "bg-cream-50",
  white: "bg-white",
  sky: "bg-sky-100",
  butter: "bg-butter-300",
  mint: "bg-mint-300",
  lilac: "bg-lilac-300",
  rose: "bg-rose-300",
  peach: "bg-peach-300",
} as const;

const PADDING = { none: "", sm: "p-4", md: "p-6", lg: "p-8" } as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: keyof typeof SURFACES;
  padding?: keyof typeof PADDING;
}

/** Rounded surface with soft shadow and a top highlight (ambient light from above). */
export function Card({
  surface = "cream",
  padding = "md",
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg shadow-soft ring-1 ring-white/70 ring-inset",
        SURFACES[surface],
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  );
}
