"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

import { cn } from "@/lib/cn";

import { StarIcon } from "../ui/icons";

/** Celebrations stay short (UX spec §1.5): ≤ 2 s. */
export const CELEBRATION_MS = 1800;

export interface StarBurstProps {
  show: boolean;
  /** Stars earned, out of `max`. */
  earned: number;
  max?: number;
  /** Called once the celebration has finished. */
  onDone?: () => void;
  className?: string;
}

const SPARKS = 10;

/** End-of-lesson star celebration. Reduced motion: fade only, no sparks. */
export function StarBurst({
  show,
  earned,
  max = 3,
  onDone,
  className,
}: StarBurstProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!show || !onDone) return;
    const t = setTimeout(onDone, CELEBRATION_MS);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-label={`Được ${earned} trên ${max} ngôi sao`}
          className={cn(
            "relative flex items-end justify-center gap-3",
            className,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {!reduce &&
            Array.from({ length: SPARKS }, (_, i) => {
              const angle = (i / SPARKS) * Math.PI * 2;
              return (
                <motion.span
                  key={`spark-${i}`}
                  aria-hidden
                  className="absolute top-1/2 left-1/2 size-3 rounded-full bg-butter-400"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * 140,
                    y: Math.sin(angle) * 100,
                    opacity: 0,
                    scale: 0.4,
                  }}
                  transition={{ duration: 1, delay: 0.25, ease: "easeOut" }}
                />
              );
            })}
          {Array.from({ length: max }, (_, i) => {
            const filled = i < earned;
            return (
              <motion.span
                key={i}
                aria-hidden
                className={cn(
                  "drop-shadow-[0_6px_0_var(--butter-600)]",
                  i === 1 ? "size-28" : "size-20",
                  filled ? "text-butter-400" : "text-cream-edge",
                )}
                initial={reduce ? { opacity: 0 } : { scale: 0, rotate: -30 }}
                animate={reduce ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                transition={
                  reduce
                    ? { duration: 0.3 }
                    : {
                        type: "spring",
                        stiffness: 300,
                        damping: 14,
                        delay: 0.15 * i,
                      }
                }
              >
                <StarIcon filled={filled} className="size-full" />
              </motion.span>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
