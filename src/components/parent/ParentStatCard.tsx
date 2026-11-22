import type { ReactNode } from "react";

import type { BrandTone } from "@/design-system/tokens";
import { cn } from "@/lib/cn";

import { LittleCard } from "../ui/LittleCard";
import { TINT } from "../ui/tones";

export interface ParentStatCardProps {
  label: string;
  value: string;
  /** Context, e.g. "7 ngày qua". */
  hint?: string;
  icon?: ReactNode;
  tone?: BrandTone;
}

/** One headline number for parents (time, sessions, streak). Never a score or ranking. */
export function ParentStatCard({
  label,
  value,
  hint,
  icon,
  tone = "blue",
}: ParentStatCardProps) {
  return (
    <LittleCard className="flex items-start gap-4">
      {icon && (
        <span
          aria-hidden
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-md [&_svg]:size-6",
            TINT[tone],
          )}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-body-sm text-ink-muted">{label}</p>
        <p className="text-h1">{value}</p>
        {hint && <p className="text-caption text-ink-muted">{hint}</p>}
      </div>
    </LittleCard>
  );
}
