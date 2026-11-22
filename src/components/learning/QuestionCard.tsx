import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface QuestionCardProps {
  /** Usually an <AudioInstruction>. */
  instruction: ReactNode;
  /** The illustrated prompt (picture, scene). Optional for audio-only questions. */
  stimulus?: ReactNode;
  /** The answers (ImageChoice/AnswerOption) or an activity (SequenceBuilder…). */
  children: ReactNode;
  /** FeedbackPanel area, reserved so the layout doesn't jump. */
  feedback?: ReactNode;
  /** `split` puts stimulus and answers side by side on desktop/landscape. */
  layout?: "stack" | "split";
  className?: string;
}

/** Layout frame for one question. Knows nothing about the question's content or answer. */
export function QuestionCard({
  instruction,
  stimulus,
  children,
  feedback,
  layout = "stack",
  className,
}: QuestionCardProps) {
  return (
    <section
      aria-label="Câu hỏi"
      className={cn(
        "flex flex-col gap-5 rounded-xl bg-surface-muted p-4 shadow-sm tablet:gap-6 tablet:p-6",
        className,
      )}
    >
      {instruction}
      <div
        className={cn(
          "grid grid-cols-1 items-center gap-5 tablet:gap-6",
          layout === "split" &&
            stimulus &&
            "desktop:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
        )}
      >
        {stimulus && <div className="grid place-items-center">{stimulus}</div>}
        <div className="flex flex-wrap items-center justify-center gap-3 tablet:gap-6">
          {children}
        </div>
      </div>
      <div aria-live="polite" className="min-h-0 empty:hidden">
        {feedback}
      </div>
    </section>
  );
}
