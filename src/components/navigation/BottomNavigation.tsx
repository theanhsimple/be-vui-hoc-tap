import Link from "next/link";

import { cn } from "@/lib/cn";

import type { NavProps } from "./types";

export interface BottomNavigationProps extends NavProps {
  /** "fixed" pins to the viewport bottom (real pages); "static" for previews. */
  position?: "fixed" | "static";
  className?: string;
}

/** Mobile tab bar for parents (3–5 items, icon + label, safe-area aware). */
export function BottomNavigation({
  items,
  currentId,
  onNavigate,
  position = "fixed",
  className,
}: BottomNavigationProps) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className={cn(
        "z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]",
        position === "fixed" && "fixed inset-x-0 bottom-0",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const current = item.id === currentId;
          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={(e) => onNavigate?.(item.id, e)}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 text-caption [&_svg]:size-6",
                  current ? "text-blue-strong" : "text-ink-muted",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid h-8 w-14 place-items-center rounded-pill",
                    current && "bg-blue-50",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
