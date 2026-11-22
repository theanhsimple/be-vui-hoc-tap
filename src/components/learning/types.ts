import type { ReactNode } from "react";

import type { IllustrationName } from "@/illustrations/registry";

/** Visual state of one answer. Grading happens outside these components (DECISIONS D-004). */
export type AnswerState =
  "idle" | "selected" | "correct" | "tryAgain" | "reveal" | "dimmed";

/** State of a multi-step activity after the child submits. */
export type ActivityStatus = "editing" | "correct" | "tryAgain" | "reveal";

/** Content-agnostic activity item: what to draw and what to call it. */
export type ActivityItem = {
  id: string;
  /** Vietnamese accessible name (also the audio/caption text). */
  label: string;
} & (
  | { illustration: IllustrationName; content?: undefined }
  /** Any decorative visual (letter tile, counting group…). */
  | { content: ReactNode; illustration?: undefined }
);
