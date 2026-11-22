import type { IllustrationName } from "@/illustrations/registry";

import { LittleIllustration } from "../ui/LittleIllustration";
import { AnswerOption, type AnswerSize } from "./AnswerOption";
import type { AnswerState } from "./types";

export interface ImageChoiceProps {
  illustration: IllustrationName;
  /** Accessible Vietnamese name of the picture. */
  label: string;
  state?: AnswerState;
  size?: AnswerSize;
  /** Show the label under the picture (for parents/early readers). Default false. */
  showCaption?: boolean;
  feedbackKey?: number;
  onSelect?: () => void;
}

/** Picture answer: an AnswerOption whose content is an illustration. */
export function ImageChoice({
  illustration,
  label,
  showCaption,
  ...rest
}: ImageChoiceProps) {
  return (
    <span className="inline-flex flex-col items-center gap-2">
      <AnswerOption label={label} {...rest}>
        <LittleIllustration name={illustration} decorative />
      </AnswerOption>
      {showCaption && (
        <span className="text-body-lg text-ink-muted">{label}</span>
      )}
    </span>
  );
}
