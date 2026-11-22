import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Logo } from "./Logo";

export interface ParentShellProps {
  /** Primary navigation (links). */
  nav?: ReactNode;
  /** Right side of the header (account menu, etc.). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Calm, spacious frame for parent screens. Single column below 768 px. */
export function ParentShell({
  nav,
  actions,
  children,
  className,
}: ParentShellProps) {
  return (
    <div className={cn("min-h-full bg-sky-100 text-ink-900", className)}>
      <header className="border-b border-sky-200 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 md:px-8">
          <Logo className="text-[26px]" />
          {nav && (
            <nav aria-label="Điều hướng chính" className="flex flex-wrap gap-1">
              {nav}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
