import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Logo } from "./Logo";

export interface AdminNavItem {
  href: string;
  label: string;
  current?: boolean;
}

export interface AdminShellProps {
  title: string;
  nav: readonly AdminNavItem[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Dense desktop-first frame for the content CMS (sidebar + content). */
export function AdminShell({
  title,
  nav,
  actions,
  children,
  className,
}: AdminShellProps) {
  return (
    <div
      className={cn(
        "grid min-h-full grid-cols-[232px_1fr] bg-white text-ink-900",
        className,
      )}
    >
      <aside className="border-r border-sky-200 bg-sky-100 px-3 py-5">
        <div className="flex items-baseline gap-2 px-3">
          <Logo className="text-[22px]" />
          <span className="text-[12px] font-bold tracking-wider text-ink-600 uppercase">
            CMS
          </span>
        </div>
        <nav
          aria-label="Quản trị nội dung"
          className="mt-6 flex flex-col gap-0.5"
        >
          {nav.map((item) => (
            <a
              key={`${item.href}:${item.label}`}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-sm px-3 text-[15px] font-semibold",
                item.current
                  ? "bg-white text-ink-900 shadow-soft"
                  : "text-ink-600 hover:bg-white/60",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-16 items-center gap-4 border-b border-sky-200 px-8">
          <h1 className="text-[22px] font-extrabold">{title}</h1>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </header>
        <main className="px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
