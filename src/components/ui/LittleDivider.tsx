import { cn } from "@/lib/cn";

export interface LittleDividerProps {
  orientation?: "horizontal" | "vertical";
  /** Optional centred label, e.g. "hoặc". */
  label?: string;
  className?: string;
}

export function LittleDivider({
  orientation = "horizontal",
  label,
  className,
}: LittleDividerProps) {
  if (orientation === "vertical") {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={cn("w-px self-stretch bg-border", className)}
      />
    );
  }
  if (!label)
    return <hr className={cn("border-0 border-t border-border", className)} />;
  return (
    <div
      role="separator"
      className={cn(
        "flex items-center gap-3 text-caption text-ink-muted",
        className,
      )}
    >
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
