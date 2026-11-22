"use client";

import { type HTMLMotionProps, motion } from "motion/react";
import { type ReactNode, forwardRef } from "react";

import { buttonPress } from "@/design-system/motion/presets";
import { cn } from "@/lib/cn";

import {
  BUTTON_VARIANTS,
  type ButtonVariant,
  DISABLED_CLASSES,
} from "./LittleButton";

const SIZES = {
  sm: "size-10 [--edge-depth:2px] [&_svg]:size-5",
  md: "size-12 [--edge-depth:3px] [&_svg]:size-6",
  lg: "size-14 [--edge-depth:4px] [&_svg]:size-7",
  xl: "size-16 [--edge-depth:4px] [&_svg]:size-8",
} as const;

export interface LittleIconButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "children" | "aria-label"
> {
  /** Accessible name (Vietnamese). Required because the button has no visible text. */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
}

export const LittleIconButton = forwardRef<
  HTMLButtonElement,
  LittleIconButtonProps
>(function LittleIconButton(
  {
    label,
    icon,
    variant = "secondary",
    size = "md",
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
      aria-label={label}
      title={label}
      disabled={disabled}
      {...(disabled ? {} : buttonPress)}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-pill select-none",
        "transition-[background-color,box-shadow,filter,translate] duration-200 ease-standard",
        variant !== "ghost" &&
          variant !== "danger" &&
          !disabled &&
          "active:translate-y-0.5 active:edge-3d-pressed",
        BUTTON_VARIANTS[variant],
        SIZES[size],
        DISABLED_CLASSES,
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="contents">
        {icon}
      </span>
    </motion.button>
  );
});
