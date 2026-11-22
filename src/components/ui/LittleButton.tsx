"use client";

import { type HTMLMotionProps, motion } from "motion/react";
import { type MouseEvent, type ReactNode, forwardRef } from "react";

import { buttonPress } from "@/design-system/motion/presets";
import { cn } from "@/lib/cn";

import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  type ButtonSize,
  type ButtonVariant,
  DISABLED_CLASSES,
} from "./buttonStyles";
import { LittleSpinner } from "./LittleSpinner";

export interface LittleButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "children"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and ignores clicks while keeping focus. */
  loading?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const LittleButton = forwardRef<HTMLButtonElement, LittleButtonProps>(
  function LittleButton(
    {
      variant = "primary",
      size = "md",
      loading = false,
      iconStart,
      iconEnd,
      fullWidth,
      disabled,
      type = "button",
      className,
      onClick,
      children,
      ...rest
    },
    ref,
  ) {
    const inert = disabled || loading;
    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          if (loading) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        {...(inert ? {} : buttonPress)}
        className={cn(
          "inline-flex items-center justify-center text-center leading-tight select-none",
          "transition-[background-color,box-shadow,filter,translate] duration-200 ease-standard",
          variant !== "ghost" &&
            variant !== "danger" &&
            !inert &&
            "active:translate-y-0.5 active:edge-3d-pressed",
          BUTTON_VARIANTS[variant],
          BUTTON_SIZES[size],
          DISABLED_CLASSES,
          loading && "cursor-progress",
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {loading ? <LittleSpinner className="size-[1.1em]" /> : iconStart}
        {children && <span>{children}</span>}
        {!loading && iconEnd}
        {loading && <span className="sr-only">Đang xử lý</span>}
      </motion.button>
    );
  },
);
