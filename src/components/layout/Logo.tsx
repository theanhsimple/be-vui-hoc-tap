import { cn } from "@/lib/cn";

/** Text wordmark placeholder until the final logo is designed. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 font-extrabold tracking-tight text-ink",
        className,
      )}
    >
      <span>little</span>
      <span
        aria-hidden
        className="inline-block size-[0.32em] rounded-pill bg-yellow"
      />
    </span>
  );
}
