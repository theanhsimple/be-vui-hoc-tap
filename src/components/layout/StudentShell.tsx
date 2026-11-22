import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface StudentShellProps {
  /** Usually <StudentNavigation>. */
  navigation?: ReactNode;
  children: ReactNode;
  /** `viewport` fills the screen (real routes); `container` fills its parent (previews). */
  fill?: "viewport" | "container";
  className?: string;
}

/**
 * Full-screen frame for the student experience: soft sky-to-cream world,
 * static scenery (no background motion), safe-area aware.
 */
export function StudentShell({
  navigation,
  children,
  fill = "viewport",
  className,
}: StudentShellProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-linear-to-b from-sky-top to-canvas to-60% text-ink",
        fill === "viewport" ? "min-h-dvh" : "h-full",
        className,
      )}
    >
      <Scenery />
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[1200px] flex-col gap-4 pt-[max(12px,env(safe-area-inset-top))] safe-px pb-[max(20px,env(safe-area-inset-bottom))] tablet:px-6",
          fill === "viewport" ? "min-h-dvh" : "h-full",
        )}
      >
        {navigation}
        <main className="flex min-h-0 flex-1 flex-col justify-center">
          {children}
        </main>
      </div>
    </div>
  );
}

function Scenery() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute top-[10%] left-[6%] h-8 w-28 rounded-pill bg-surface/70" />
      <div className="absolute top-[7%] left-[11%] h-12 w-16 rounded-pill bg-surface/70" />
      <div className="absolute top-[16%] right-[8%] h-8 w-32 rounded-pill bg-surface/60" />
      <div className="absolute -bottom-[14%] -left-[12%] h-[30%] w-[64%] rounded-[50%] bg-mint-50" />
      <div className="absolute -right-[14%] -bottom-[18%] h-[32%] w-[70%] rounded-[50%] bg-mint/40" />
    </div>
  );
}
