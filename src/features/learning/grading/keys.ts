/** Private answer key shapes (server only; mirrors private.question_keys). */
export type AnswerKey =
  | {
      type: "choice";
      optionId: string;
      /** A wrong option to fade out as a hint. */ hintEliminate?: string;
    }
  | { type: "matching"; pairs: Array<[string, string]> }
  | { type: "ordering"; order: string[] }
  | { type: "pattern"; fills: string[] }
  | { type: "memory" };
