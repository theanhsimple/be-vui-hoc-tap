"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  cloneElement,
  useId,
  useState,
} from "react";

import { fadeIn } from "@/design-system/motion/presets";
import { cn } from "@/lib/cn";

type TriggerProps = HTMLAttributes<HTMLElement>;

export interface LittleTooltipProps {
  /** Supplementary text only — never essential information (touch devices may never show it). */
  content: string;
  children: ReactElement<TriggerProps>;
  side?: "top" | "bottom";
}

/** Shows on pointer hover and on keyboard focus; Escape hides it. Parent/admin use only. */
export function LittleTooltip({
  content,
  children,
  side = "top",
}: LittleTooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const p = children.props;

  const trigger = cloneElement(children, {
    "aria-describedby": cn(p["aria-describedby"], id),
    onMouseEnter: (e: MouseEvent<HTMLElement>) => {
      p.onMouseEnter?.(e);
      setOpen(true);
    },
    onMouseLeave: (e: MouseEvent<HTMLElement>) => {
      p.onMouseLeave?.(e);
      setOpen(false);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      p.onFocus?.(e);
      setOpen(true);
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      p.onBlur?.(e);
      setOpen(false);
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      p.onKeyDown?.(e);
      if (e.key === "Escape") setOpen(false);
    },
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      <span id={id} role="tooltip" className={open ? "contents" : "sr-only"}>
        <AnimatePresence>
          {open && (
            <motion.span
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "pointer-events-none absolute left-1/2 z-40 w-max max-w-60 -translate-x-1/2 rounded-sm bg-ink px-3 py-2 text-body-sm font-semibold text-surface shadow-md",
                side === "top" ? "bottom-full mb-2" : "top-full mt-2",
              )}
            >
              {content}
            </motion.span>
          )}
        </AnimatePresence>
        {!open && content}
      </span>
    </span>
  );
}
