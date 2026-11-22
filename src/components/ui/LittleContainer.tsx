import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const WIDTH = {
  narrow: "max-w-[720px]",
  default: "max-w-[1120px]",
  wide: "max-w-[1280px]",
  full: "max-w-none",
} as const;

export interface LittleContainerProps extends HTMLAttributes<HTMLDivElement> {
  width?: keyof typeof WIDTH;
}

/** Centred content column with safe-area-aware gutters (16 → 24 → 32 px). */
export function LittleContainer({
  width = "default",
  className,
  ...rest
}: LittleContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full safe-px tablet:px-6 desktop:px-8",
        WIDTH[width],
        className,
      )}
      {...rest}
    />
  );
}
