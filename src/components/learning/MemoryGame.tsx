"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { DURATION, fadeIn } from "@/design-system/motion/presets";
import type { IllustrationName } from "@/illustrations/registry";
import { useAudio } from "@/lib/audio";
import { cn } from "@/lib/cn";

import { LittleIllustration } from "../ui/LittleIllustration";

export interface MemoryCard {
  id: string;
  /** Cards with the same pairKey match. */
  pairKey: string;
  label: string;
  illustration: IllustrationName;
}

export interface MemoryGameProps {
  /** Cards in display order (shuffled by the caller). */
  cards: readonly MemoryCard[];
  columns?: 2 | 3 | 4;
  /** ms a mismatched pair stays visible before turning back. */
  mismatchDelay?: number;
  onComplete?: (result: { moves: number }) => void;
}

const COLS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 tablet:grid-cols-4",
} as const;

/** Find the pairs. Unlike graded questions, pair keys are needed client-side by design. */
export function MemoryGame({
  cards,
  columns = 4,
  mismatchDelay = 900,
  onComplete,
}: MemoryGameProps) {
  const { playSfx } = useAudio();
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const byId = new Map(cards.map((c) => [c.id, c]));

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flip = (id: string) => {
    if (open.length === 2 || open.includes(id)) return;
    const card = byId.get(id);
    if (!card || matched.has(card.pairKey)) return;
    playSfx("tap");
    const next = [...open, id];
    setOpen(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = next.map((x) => byId.get(x)!);
    if (a!.pairKey === b!.pairKey) {
      const done = new Set(matched).add(a!.pairKey);
      setMatched(done);
      setOpen([]);
      setMessage(`Đúng rồi: ${a!.label}!`);
      playSfx("correct");
      if (done.size * 2 >= cards.length) onComplete?.({ moves: moves + 1 });
    } else {
      setMessage("Chưa giống nhau, thử lại nhé.");
      playSfx("tryAgain");
      timer.current = setTimeout(() => setOpen([]), mismatchDelay);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className={cn("grid w-full gap-2 tablet:gap-3", COLS[columns])}>
        {cards.map((card, i) => {
          const isMatched = matched.has(card.pairKey);
          const faceUp = isMatched || open.includes(card.id);
          return (
            <motion.button
              key={card.id}
              type="button"
              aria-label={
                faceUp
                  ? `${card.label}${isMatched ? ", đã ghép" : ""}`
                  : `Thẻ úp số ${i + 1}`
              }
              aria-pressed={faceUp}
              data-state={isMatched ? "matched" : faceUp ? "open" : "closed"}
              onClick={() => flip(card.id)}
              whileTap={
                faceUp
                  ? undefined
                  : { scale: 0.96, transition: { duration: DURATION.press } }
              }
              className={cn(
                "relative grid aspect-square w-full min-w-16 place-items-center rounded-lg edge-3d transition-colors duration-200",
                isMatched
                  ? "cursor-default bg-mint-50 [--edge:var(--mint-edge)]"
                  : faceUp
                    ? "bg-surface [--edge:var(--surface-edge)]"
                    : "bg-lavender [--edge:var(--lavender-edge)] hover:brightness-[1.03]",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {faceUp ? (
                  <motion.span
                    key="face"
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute inset-[14%] grid place-items-center [&>svg]:size-full"
                  >
                    <LittleIllustration name={card.illustration} decorative />
                  </motion.span>
                ) : (
                  <motion.span
                    key="back"
                    aria-hidden
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="size-1/2 rounded-pill bg-lavender-50/60 ring-4 ring-lavender-50/40"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}
