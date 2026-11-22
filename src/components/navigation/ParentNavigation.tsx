import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Logo } from "../layout/Logo";
import type { NavProps } from "./types";

export interface ParentNavigationProps extends NavProps {
  /** Right side: account menu, child switcher… */
  actions?: ReactNode;
}

/** Parent header. Links show inline from tablet up; on mobile use BottomNavigation. */
export function ParentNavigation({
  items,
  currentId,
  onNavigate,
  actions,
}: ParentNavigationProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1120px] items-center gap-6 safe-px tablet:px-6 desktop:px-8">
        <Logo className="text-h2" />
        <nav aria-label="Điều hướng chính" className="hidden tablet:block">
          <ul className="flex gap-1">
            {items.map((item) => {
              const current = item.id === currentId;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    onClick={(e) => onNavigate?.(item.id, e)}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-pill px-4 text-body font-bold transition-colors duration-200 [&_svg]:size-5",
                      current
                        ? "bg-surface text-ink shadow-xs"
                        : "text-ink-muted hover:bg-surface/70 hover:text-ink",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
