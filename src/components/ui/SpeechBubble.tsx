import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface SpeechBubbleProps extends HTMLAttributes<HTMLDivElement> {
  /** Which side the tail points to (towards the speaker). */
  tail?: "left" | "bottom" | "none";
  size?: "child" | "parent";
}

/**
 * The mascot's speech bubble. In the student experience the text is a caption
 * for adults; the child receives the same message as audio.
 */
export function SpeechBubble({
  tail = "left",
  size = "child",
  className,
  children,
  ...rest
}: SpeechBubbleProps) {
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-lg bg-surface text-ink shadow-sm",
        size === "child" ? "px-5 py-4 text-h2" : "px-4 py-3 text-body-lg",
        className,
      )}
      {...rest}
    >
      {children}
      {tail !== "none" && (
        <span
          aria-hidden
          className={cn(
            "absolute size-4 rotate-45 rounded-[3px] bg-surface",
            tail === "left"
              ? "top-1/2 -left-1.5 -translate-y-1/2"
              : "-bottom-1.5 left-10",
          )}
        />
      )}
    </div>
  );
}
