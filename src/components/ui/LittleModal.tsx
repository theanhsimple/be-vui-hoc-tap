"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import { fadeIn, scaleIn } from "@/design-system/motion/presets";
import { cn } from "@/lib/cn";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface LittleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Small label above the title, e.g. "Dành cho bố mẹ". */
  eyebrow?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Close when the backdrop is clicked. Default true. */
  dismissible?: boolean;
}

const WIDTH = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" } as const;

/**
 * Accessible modal dialog: focus moves in and is trapped, Escape closes,
 * focus returns to the trigger, background scroll is locked.
 */
export function LittleModal({
  open,
  onClose,
  title,
  eyebrow,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: LittleModalProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalDialog
          onClose={onClose}
          title={title}
          eyebrow={eyebrow}
          description={description}
          footer={footer}
          size={size}
          dismissible={dismissible}
        >
          {children}
        </ModalDialog>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ModalDialog({
  onClose,
  title,
  eyebrow,
  description,
  children,
  footer,
  size,
  dismissible,
}: Omit<LittleModalProps, "open"> & {
  size: keyof typeof WIDTH;
  dismissible: boolean;
}) {
  const titleId = useId();
  const descId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      e.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-ink/50"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={dismissible ? onClose : undefined}
      />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          "relative max-h-[calc(100dvh-32px)] w-full overflow-y-auto rounded-xl bg-surface p-6 text-ink shadow-lg outline-none tablet:p-8",
          WIDTH[size],
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-pill text-ink-muted transition-colors hover:bg-surface-muted"
        >
          <X aria-hidden className="size-5" />
        </button>
        {eyebrow && (
          <div className="mb-2 pr-10 text-body-sm font-bold text-ink-muted">
            {eyebrow}
          </div>
        )}
        <h2 id={titleId} className="pr-10 text-h2">
          {title}
        </h2>
        {description && (
          <div id={descId} className="mt-2 text-body text-ink-muted">
            {description}
          </div>
        )}
        {children && <div className="mt-5">{children}</div>}
        {footer && (
          <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>
        )}
      </motion.div>
    </div>
  );
}
