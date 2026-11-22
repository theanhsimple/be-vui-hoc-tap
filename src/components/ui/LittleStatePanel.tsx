import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { LittleIllustration } from "./LittleIllustration";
import { LittleSpinner } from "./LittleSpinner";

type Props =
  | { kind: "loading"; title?: string; description?: string; action?: never }
  | { kind: "empty"; title: string; description?: string; action?: ReactNode }
  /** Errors must offer a way to recover. */
  | { kind: "error"; title: string; description?: string; action: ReactNode };

export type LittleStatePanelProps = Props & { className?: string };

/**
 * Loading / empty / error patterns. Plain-language copy, a friendly
 * illustration, and a clear next step — never an indefinite blank screen.
 */
export function LittleStatePanel(props: LittleStatePanelProps) {
  const { kind, className } = props;
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "loading" ? "polite" : undefined}
      className={cn(
        "flex flex-col items-center gap-3 px-4 py-10 text-center",
        className,
      )}
    >
      {kind === "loading" ? (
        <LittleSpinner className="size-10 text-blue-strong" />
      ) : (
        <LittleIllustration
          name={kind === "empty" ? "state.empty" : "state.error"}
          size={112}
          decorative
        />
      )}
      <p className="text-h3">{props.title ?? "Đang tải…"}</p>
      {props.description && (
        <p className="max-w-md text-body text-ink-muted">{props.description}</p>
      )}
      {props.action && (
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {props.action}
        </div>
      )}
    </div>
  );
}
