import type { BrandTone } from "@/design-system/tokens";
import type { Visual } from "@/features/learning/types";
import { cn } from "@/lib/cn";

import { LittleIllustration } from "../ui/LittleIllustration";

const GLYPH_FILL: Record<BrandTone, string> = {
  blue: "fill-blue-strong",
  yellow: "fill-yellow-strong",
  coral: "fill-coral-strong",
  mint: "fill-mint-strong",
  lavender: "fill-lavender-strong",
};

const groupCols = (n: number) => (n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4);

export interface VisualViewProps {
  visual: Visual;
  /** Accessible name. Omit when the parent (e.g. a button) already has one. */
  label?: string;
  className?: string;
  priority?: boolean;
}

/** Renders any content Visual so it scales to its container. */
export function VisualView({
  visual,
  label,
  className,
  priority,
}: VisualViewProps) {
  if (visual.kind === "illustration") {
    return label ? (
      <LittleIllustration
        name={visual.name}
        alt={label}
        className={className}
        priority={priority}
      />
    ) : (
      <LittleIllustration name={visual.name} decorative className={className} />
    );
  }
  if (visual.kind === "glyph") {
    return (
      <svg
        viewBox="0 0 120 120"
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={cn("block h-auto w-full", className)}
      >
        <text
          x="60"
          y="62"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={visual.text.length > 1 ? 64 : 88}
          fontWeight={800}
          className={GLYPH_FILL[visual.tone ?? "blue"]}
        >
          {visual.text}
        </text>
      </svg>
    );
  }
  const cols = groupCols(visual.count);
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-count={visual.count}
      className={cn("grid w-full place-items-center gap-[4%]", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: visual.count }, (_, i) => (
        <LittleIllustration key={i} name={visual.name} decorative />
      ))}
    </div>
  );
}
