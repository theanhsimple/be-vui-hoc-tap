import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/Logo";
import { LittleCard } from "@/components/ui/LittleCard";

/** Calm, centred frame for the parent sign-in pages. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-8">
      <div className="flex w-full max-w-md flex-col gap-5">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center self-center px-2"
          aria-label="little — trang chủ"
        >
          <Logo className="text-display" />
        </Link>
        <LittleCard padding="lg" className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1">{title}</h1>
            {description && (
              <p className="text-body text-ink-muted">{description}</p>
            )}
          </div>
          {children}
        </LittleCard>
        {footer && (
          <div className="flex flex-col items-center gap-2 text-body">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center font-bold text-blue-strong underline underline-offset-4"
    >
      {children}
    </Link>
  );
}
