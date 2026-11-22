import { cn } from "@/lib/cn";

import { MASTERY_BANDS, MASTERY_LABEL, type MasteryBand } from "./mastery";

/** Three-step band indicator (no percentages). Label is always shown next to it. */
export function MasteryMeter({
  band,
  className,
}: {
  band: MasteryBand;
  className?: string;
}) {
  const level = MASTERY_BANDS.indexOf(band);
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-hidden
    >
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={cn(
            "h-2 w-6 rounded-pill",
            step <= level ? "bg-mint-strong" : "bg-border",
          )}
        />
      ))}
      <span className="sr-only">{MASTERY_LABEL[band]}</span>
    </span>
  );
}
