import type { ActivityStatus } from "@/components/learning/types";
import type {
  LearningQuestion,
  QuestionOption,
  QuestionResponse,
  Reveal,
} from "@/features/learning/types";

export interface ActivityProps<Q extends LearningQuestion = LearningQuestion> {
  question: Q;
  /** editing | tryAgain (after a wrong try) | correct | reveal (answer shown). */
  status: ActivityStatus;
  attempt: number;
  /** True while grading or after the question is finished. */
  locked: boolean;
  reveal?: Reveal;
  /** Options faded out by a hint. */
  eliminated: readonly string[];
  onSubmit: (response: QuestionResponse) => void;
}

export type { QuestionOption };
