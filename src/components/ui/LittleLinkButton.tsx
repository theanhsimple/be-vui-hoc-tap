import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonStyles";

export interface LittleLinkButtonProps
  extends
    LinkProps,
    Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      keyof LinkProps | "children"
    > {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  children: ReactNode;
}

/** Navigation that looks like a LittleButton (same variants, sizes, states). */
export function LittleLinkButton({
  variant = "primary",
  size = "md",
  iconStart,
  iconEnd,
  className,
  children,
  ...rest
}: LittleLinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center text-center leading-tight select-none",
        "transition-[background-color,box-shadow,filter,translate] duration-200 ease-standard",
        variant !== "ghost" &&
          variant !== "danger" &&
          "active:translate-y-0.5 active:edge-3d-pressed",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {iconStart && (
        <span aria-hidden className="contents">
          {iconStart}
        </span>
      )}
      <span>{children}</span>
      {iconEnd && (
        <span aria-hidden className="contents">
          {iconEnd}
        </span>
      )}
    </Link>
  );
}
