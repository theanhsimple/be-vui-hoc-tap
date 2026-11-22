import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface KidShellProps {
  /** Small corner controls (back, parent-gate button, sound). */
  topBar?: ReactNode;
  /** Mascot + speech bubble + replay button. */
  guide?: ReactNode;
  /** Large answers or the "next" button. */
  actions?: ReactNode;
  /** The activity stage. */
  children: ReactNode;
  /** `viewport` fills the screen (real kid routes); `container` fills its parent (previews). */
  fill?: "viewport" | "container";
  className?: string;
}

/**
 * Full-screen kid-mode frame with the three zones from UX spec §4:
 * guide row, stage, action row. Respects iPad safe areas.
 */
export function KidShell({
  topBar,
  guide,
  actions,
  children,
  fill = "viewport",
  className,
}: KidShellProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-linear-to-b from-sky-100 to-sky-200 text-ink-900",
        fill === "viewport" ? "min-h-dvh" : "h-full",
        className,
      )}
    >
      <Scenery />
      <div
        className={cn(
          "relative mx-auto grid w-full max-w-[1200px] grid-rows-[auto_auto_1fr_auto] gap-4",
          "pt-[max(16px,env(safe-area-inset-top))] pr-[max(16px,env(safe-area-inset-right))]",
          "pb-[max(20px,env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))]",
          fill === "viewport" ? "min-h-dvh" : "h-full",
        )}
      >
        <div className="flex min-h-16 items-center justify-between gap-3">
          {topBar}
        </div>
        <div className="flex items-center gap-4">{guide}</div>
        <main className="grid min-h-0 place-items-center">{children}</main>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {actions}
        </div>
      </div>
    </div>
  );
}

/** Soft pastel scenery: clouds and hills. Purely decorative. */
function Scenery() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute top-[12%] left-[8%] h-10 w-32 rounded-full bg-white/80 blur-[2px]" />
      <div className="absolute top-[8%] left-[14%] h-14 w-20 rounded-full bg-white/80 blur-[2px]" />
      <div className="absolute top-[20%] right-[10%] h-10 w-36 rounded-full bg-white/70 blur-[2px]" />
      <div className="absolute top-[16%] right-[16%] h-14 w-20 rounded-full bg-white/70 blur-[2px]" />
      <div className="absolute -bottom-[18%] -left-[10%] h-[38%] w-[70%] rounded-[50%] bg-mint-300" />
      <div className="absolute -right-[12%] -bottom-[22%] h-[40%] w-[75%] rounded-[50%] bg-mint-400/80" />
    </div>
  );
}
