"use client";

import { type HTMLMotionProps, motion } from "motion/react";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

import { TONES, type Tone } from "./tones";

/**
 * Heights (px): `sm` 44 and `md` 52 are for parent/admin screens;
 * `kid` 72 and `hero` 96 are for kid mode (≥ 64 px target floor).
 */
const SIZES = {
  sm: "min-h-11 min-w-11 px-4 text-[15px] rounded-md",
  md: "min-h-13 min-w-13 px-6 text-[17px] rounded-md",
  kid: "min-h-18 min-w-18 px-8 text-[24px] rounded-lg",
  hero: "min-h-24 min-w-24 px-12 text-[32px] rounded-xl",
} as const;

const CIRCLE = {
  sm: "size-11 rounded-full",
  md: "size-13 rounded-full",
  kid: "size-18 rounded-full",
  hero: "size-24 rounded-full",
} as const;

export type Button3DSize = keyof typeof SIZES;

export interface Button3DProps extends HTMLMotionProps<"button"> {
  tone?: Tone;
  size?: Button3DSize;
  shape?: "pill" | "circle";
}

/** Chunky extruded button that squashes when pressed. */
export const Button3D = forwardRef<HTMLButtonElement, Button3DProps>(
  function Button3D(
    {
      tone = "sky",
      size = "md",
      shape = "pill",
      className,
      type = "button",
      disabled,
      ...rest
    },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-extrabold edge-3d select-none",
          "motion-safe:transition-[translate,box-shadow] motion-safe:duration-100",
          "active:translate-y-1 active:edge-3d-pressed",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 disabled:active:edge-3d",
          TONES[tone],
          shape === "circle" ? cn(CIRCLE[size], "p-0") : SIZES[size],
          className,
        )}
        {...rest}
      />
    );
  },
);

export interface IconButton3DProps extends Omit<
  Button3DProps,
  "shape" | "aria-label"
> {
  /** Required: icon-only buttons need an accessible name (Vietnamese). */
  label: string;
}

export const IconButton3D = forwardRef<HTMLButtonElement, IconButton3DProps>(
  function IconButton3D({ label, ...rest }, ref) {
    return (
      <Button3D
        ref={ref}
        shape="circle"
        aria-label={label}
        title={label}
        {...rest}
      />
    );
  },
);
