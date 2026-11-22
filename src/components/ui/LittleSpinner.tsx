import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/cn";

/** Loading indicator. Slows down (but keeps turning) for reduced-motion users. */
export function LittleSpinner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role={label ? "status" : undefined}
      className="inline-flex items-center"
    >
      <LoaderCircle
        aria-hidden
        className={cn(
          "size-5 animate-spin motion-reduce:[animation-duration:2.4s]",
          className,
        )}
      />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
