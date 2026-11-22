"use client";

import { Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import {
  type GateChallenge,
  HOLD_MS,
  createChallenge,
} from "@/lib/parent-gate/challenge";

import { LittleModal } from "../ui/LittleModal";

export interface ParentGateProps {
  open: boolean;
  onPass: () => void;
  onCancel: () => void;
  /** Injectable randomness, for tests. */
  rng?: () => number;
}

/**
 * Adult-only check guarding every exit from the student experience (PRD S9).
 * The instruction is written in words and is deliberately never spoken.
 */
export function ParentGate({ open, onPass, onCancel, rng }: ParentGateProps) {
  return (
    <LittleModal
      open={open}
      onClose={onCancel}
      size="sm"
      dismissible={false}
      eyebrow={
        <span className="inline-flex items-center gap-1.5">
          <Lock aria-hidden className="size-4" /> Dành cho bố mẹ
        </span>
      }
      title="Xác nhận người lớn"
    >
      {open && <GateBody onPass={onPass} rng={rng} />}
    </LittleModal>
  );
}

function GateBody({ onPass, rng }: { onPass: () => void; rng?: () => number }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [challenge, setChallenge] = useState<GateChallenge>(() =>
    createChallenge(rng),
  );
  const [holding, setHolding] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const cancelHold = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(null);
  }, []);

  const startHold = (n: number) => {
    if (timer.current) return;
    setWrong(false);
    setHolding(n);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(null);
      if (n === challenge.target) {
        onPass();
      } else {
        setWrong(true);
        setChallenge(createChallenge(rng));
      }
    }, HOLD_MS);
  };

  return (
    <div>
      <p className="text-body-lg">
        Nhấn giữ số{" "}
        <strong className="font-extrabold">{challenge.words}</strong> để tiếp
        tục.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {challenge.options.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={String(n)}
            className={cn(
              "relative min-h-16 overflow-hidden rounded-md bg-surface text-h1 text-ink shadow-xs ring-2 ring-border select-none [-webkit-touch-callout:none] ring-inset",
              holding === n && "ring-blue-strong",
            )}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              startHold(n);
            }}
            onPointerUp={cancelHold}
            onPointerCancel={cancelHold}
            onLostPointerCapture={cancelHold}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                e.preventDefault();
                startHold(n);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " ") cancelHold();
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <AnimatePresence>
              {holding === n && (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-blue-50"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: HOLD_MS / 1000, ease: "linear" }}
                />
              )}
            </AnimatePresence>
            <span className="relative">{n}</span>
          </button>
        ))}
      </div>
      <p
        aria-live="polite"
        className="mt-4 min-h-6 text-body-sm text-ink-muted"
      >
        {wrong
          ? "Chưa đúng. Hãy thử lại với số mới."
          : "Nhấn và giữ đến khi thanh màu chạy đầy."}
      </p>
    </div>
  );
}
