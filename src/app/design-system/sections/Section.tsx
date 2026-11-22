import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 border-t border-border pt-10"
    >
      <h2 id={`${id}-title`} className="text-h1">
        {title}
      </h2>
      {intro && (
        <p className="mt-2 max-w-3xl text-body text-ink-muted">{intro}</p>
      )}
      <div className="mt-6 flex flex-col gap-8">{children}</div>
    </section>
  );
}

export function Demo({
  title,
  note,
  children,
  className,
}: {
  title: string;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div>
      <h3 className="text-h3">{title}</h3>
      {note && <p className="mt-1 text-body-sm text-ink-muted">{note}</p>}
      <div className={cn("mt-3", className)}>{children}</div>
    </div>
  );
}
