import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { AdminNavigation } from "../navigation/AdminNavigation";
import type { NavProps } from "../navigation/types";
import { Logo } from "./Logo";

export interface AdminShellProps extends Omit<NavProps, "items"> {
  children: ReactNode;
  className?: string;
}

/**
 * Desktop-first CMS frame. Sidebar from 1024 px; below that the navigation
 * stacks above the content so the CMS stays usable on an iPad.
 */
export function AdminShell({ children, className, ...nav }: AdminShellProps) {
  return (
    <div
      className={cn(
        "grid min-h-full bg-surface text-ink desktop:grid-cols-[248px_minmax(0,1fr)]",
        className,
      )}
    >
      <aside className="border-b border-border bg-canvas px-3 py-4 desktop:border-r desktop:border-b-0 desktop:py-6">
        <div className="mb-4 flex items-baseline gap-2 px-3">
          <Logo className="text-h3" />
          <span className="text-caption text-ink-muted uppercase">CMS</span>
        </div>
        <div className="max-h-64 overflow-y-auto desktop:max-h-none">
          <AdminNavigation {...nav} />
        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 tablet:px-6 desktop:px-8">
        {children}
      </div>
    </div>
  );
}
