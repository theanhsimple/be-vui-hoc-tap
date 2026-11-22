import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface SpeechBubbleProps extends HTMLAttributes<HTMLDivElement> {
  /** Which side the tail points to (towards the speaker). */
  tail?: "left" | "bottom" | "none";
  size?: "kid" | "parent";
}

/**
 * The mascot's speech bubble. In kid mode its text is a caption for adults;
 * the child gets the same message as audio (see AudioPromptButton).
 */
export function SpeechBubble({
  tail = "left",
  size = "kid",
  className,
  children,
  ...rest
}: SpeechBubbleProps) {
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-lg bg-white text-ink-900 shadow-soft",
        size === "kid"
          ? "px-5 py-4 text-[clamp(20px,2.6vw,28px)] leading-snug font-extrabold"
          : "px-4 py-3 text-[17px] font-semibold",
        className,
      )}
      {...rest}
    >
      {children}
      {tail !== "none" && (
        <span
          aria-hidden
          className={cn(
            "absolute size-5 rotate-45 rounded-[4px] bg-white",
            tail === "left"
              ? "top-1/2 -left-2 -translate-y-1/2"
              : "-bottom-2 left-10",
          )}
        />
      )}
    </div>
  );
}
