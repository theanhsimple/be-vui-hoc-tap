import { cn } from "@/lib/cn";

const FILL = {
  blue: "bg-blue",
  mint: "bg-mint",
  yellow: "bg-yellow",
  lavender: "bg-lavender",
  coral: "bg-coral",
} as const;

export interface LittleProgressProps {
  value: number;
  max?: number;
  /** Accessible name, e.g. "Hoàn thành tuần này". Shown visually unless hideLabel. */
  label: string;
  hideLabel?: boolean;
  /** Text shown at the end of the label row, e.g. "3/5 bài". */
  valueText?: string;
  tone?: keyof typeof FILL;
  size?: "sm" | "md";
  className?: string;
}

/** Determinate progress bar for parent/admin. Children see LearningProgress instead. */
export function LittleProgress({
  value,
  max = 100,
  label,
  hideLabel,
  valueText,
  tone = "blue",
  size = "md",
  className,
}: LittleProgressProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? (clamped / max) * 100 : 0;
  return (
    <div className={cn("w-full", className)}>
      {!hideLabel && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-body-sm">
          <span className="font-bold text-ink">{label}</span>
          {valueText && <span className="text-ink-muted">{valueText}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-valuetext={valueText}
        className={cn(
          "w-full overflow-hidden rounded-pill bg-border",
          size === "sm" ? "h-2" : "h-3",
        )}
      >
        <div
          className={cn(
            "h-full rounded-pill transition-[width] duration-300 ease-out motion-reduce:transition-none",
            FILL[tone],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
