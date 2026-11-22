"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/cn";
import {
  type GateChallenge,
  HOLD_MS,
  createChallenge,
} from "@/lib/parent-gate/challenge";

import { CloseIcon, LockIcon } from "../ui/icons";

export interface ParentGateProps {
  open: boolean;
  onPass: () => void;
  onCancel: () => void;
  /** Injectable randomness, for tests. */
  rng?: () => number;
}

/**
 * Adult-only check guarding every exit from kid mode (PRD S9).
 * The instruction is text only and is deliberately never spoken.
 */
export function ParentGate({ open, onPass, onCancel, rng }: ParentGateProps) {
  if (!open) return null;
  return <ParentGateDialog onPass={onPass} onCancel={onCancel} rng={rng} />;
}

function ParentGateDialog({
  onPass,
  onCancel,
  rng,
}: Omit<ParentGateProps, "open">) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [challenge, setChallenge] = useState<GateChallenge>(() =>
    createChallenge(rng),
  );
  const [holding, setHolding] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);

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

  // Focus management: move focus in on open, restore on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      previous?.focus?.();
    };
  }, []);

  const onDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      "button:not([disabled])",
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === dialogRef.current)
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        className="relative w-full max-w-md rounded-xl bg-cream-50 p-6 shadow-lift outline-none sm:p-8"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Đóng"
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-ink-600 hover:bg-sky-100"
        >
          <CloseIcon className="size-5" />
        </button>

        <div className="flex items-center gap-2 text-ink-600">
          <LockIcon className="size-5" />
          <h2
            id={titleId}
            className="text-[15px] font-bold tracking-wide uppercase"
          >
            Dành cho bố mẹ
          </h2>
        </div>
        <p
          id={descId}
          className="mt-3 text-[20px] leading-snug font-semibold text-ink-900"
        >
          Nhấn giữ số{" "}
          <strong className="font-extrabold">{challenge.words}</strong> để tiếp
          tục.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {challenge.options.map((n) => (
            <button
              key={n}
              type="button"
              aria-label={String(n)}
              className={cn(
                "relative h-18 overflow-hidden rounded-lg bg-white text-[28px] font-extrabold text-ink-900",
                "shadow-soft ring-2 ring-sky-200 select-none [-webkit-touch-callout:none]",
                holding === n && "ring-sky-600",
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
                    className="absolute inset-y-0 left-0 bg-sky-200"
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
          className="mt-4 min-h-6 text-[15px] font-semibold text-ink-600"
        >
          {wrong
            ? "Chưa đúng. Hãy thử lại với số mới."
            : "Nhấn và giữ đến khi thanh màu chạy đầy."}
        </p>
      </div>
    </div>
  );
}
