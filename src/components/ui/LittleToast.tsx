"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fadeUp } from "@/design-system/motion/presets";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "info" | "warning" | "error";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: { label: string; onClick: () => void };
  /** ms before auto-dismiss. Toasts with an action stay until dismissed. Default 5000. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

const TONE = {
  success: { cls: "bg-success-50 text-success-strong", Icon: CircleCheck },
  info: { cls: "bg-blue-50 text-blue-strong", Icon: Info },
  warning: { cls: "bg-warning-50 text-warning-strong", Icon: TriangleAlert },
  error: { cls: "bg-error-50 text-error-strong", Icon: CircleAlert },
} as const;

export interface LittleToastProps extends ToastOptions {
  onDismiss: () => void;
}

/** Visual toast. Usually shown through useToast(); exported for the showcase. */
export function LittleToast({
  title,
  description,
  tone = "info",
  action,
  onDismiss,
}: LittleToastProps) {
  const { cls, Icon } = TONE[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-md bg-surface p-4 text-ink shadow-md ring-1 ring-border"
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-pill",
          cls,
        )}
      >
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-bold">{title}</p>
        {description && (
          <p className="mt-0.5 text-body-sm text-ink-muted">{description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onDismiss();
            }}
            className="mt-2 min-h-10 rounded-sm px-2 text-body-sm font-bold text-blue-strong hover:bg-blue-50"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo"
        className="grid size-10 shrink-0 place-items-center rounded-pill text-ink-muted hover:bg-surface-muted"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(
  null,
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback(
    (id: number) => setItems((all) => all.filter((t) => t.id !== id)),
    [],
  );
  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setItems((all) => [...all.slice(-2), { ...options, id }]);
  }, []);
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Thông báo"
        role="region"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[max(16px,env(safe-area-inset-bottom))]"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex w-full justify-center"
            >
              <TimedToast item={t} onDismiss={() => dismiss(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function TimedToast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const { duration = 5000, action } = item;
  useEffect(() => {
    if (action) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [action, duration, onDismiss]);
  return <LittleToast {...item} onDismiss={onDismiss} />;
}

export function useToast(): (options: ToastOptions) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
