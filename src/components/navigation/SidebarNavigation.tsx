import Link from "next/link";

import { cn } from "@/lib/cn";

import type { NavItem, NavProps } from "./types";

export interface SidebarSection {
  title?: string;
  items: readonly NavItem[];
}

export interface SidebarNavigationProps extends Omit<NavProps, "items"> {
  sections: readonly SidebarSection[];
  label: string;
}

/** Vertical navigation for dense desktop tools. */
export function SidebarNavigation({
  sections,
  currentId,
  onNavigate,
  label,
}: SidebarNavigationProps) {
  return (
    <nav aria-label={label} className="flex flex-col gap-5">
      {sections.map((section, s) => (
        <div key={section.title ?? s}>
          {section.title && (
            <p className="mb-1 px-3 text-caption text-ink-muted uppercase">
              {section.title}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const current = item.id === currentId;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    onClick={(e) => onNavigate?.(item.id, e)}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-sm px-3 text-body-sm font-bold transition-colors duration-200 [&_svg]:size-5",
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
        </div>
      ))}
    </nav>
  );
}
