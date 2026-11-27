"use client";

import { createContext, type ReactNode, use } from "react";

import type { HintResult } from "./types";
import type {
  ActionFailure,
  SubmitAnswerResult,
  SubmitPlacementResult,
} from "./backend/actions";
import type { QuestionResponse } from "./types";

/**
 * Where learning actions run. The SAME screens work in two editions:
 *   - "server": Next.js Server Functions + Supabase (src/features/learning/server-runtime.tsx)
 *   - "device": everything on the device, for static hosting (src/device/runtime.tsx)
 * Components call this instead of importing Server Functions, so the device
 * edition never bundles server code. (Type-only imports above are erased.)
 */
export interface LearningRuntime {
  edition: "server" | "device";
  /** Starts or resumes a lesson for the selected child, then opens the player. */
  startLesson(input: {
    lessonId: string;
    restart: boolean;
  }): Promise<ActionFailure | void>;
  submitAnswer(input: {
    sessionId: string;
    questionId: string;
    response: QuestionResponse;
    idempotencyKey: string;
  }): Promise<SubmitAnswerResult>;
  requestHint(input: {
    sessionId: string;
    questionId: string;
  }): Promise<({ ok: true } & HintResult) | ActionFailure>;
  markRewardsSeen(): Promise<void>;
  /** Profile selection; opens the child's home on success. */
  selectChild(childId: string): Promise<{ ok: false; message: string } | void>;
  /** Back to profile selection. */
  leaveStudent(): Promise<void>;
  /** Absent when there are no accounts (device edition). */
  signOut?: () => Promise<void>;
  submitPlacement(input: {
    runId: string;
    questionId: string;
    response: QuestionResponse;
    idempotencyKey: string;
  }): Promise<SubmitPlacementResult>;
  /** Called after an adult passes a parent gate inside the child area. */
  grantParentAccess?: () => void;
  links: {
    parentHome: string;
    childReport(childId: string, saved?: string): string;
  };
}

const RuntimeContext = createContext<LearningRuntime | null>(null);

export function LearningRuntimeProvider({
  runtime,
  children,
}: {
  runtime: LearningRuntime;
  children: ReactNode;
}) {
  return <RuntimeContext value={runtime}>{children}</RuntimeContext>;
}

export function useLearningRuntime(): LearningRuntime {
  const runtime = use(RuntimeContext);
  if (!runtime)
    throw new Error(
      "useLearningRuntime must be used inside <LearningRuntimeProvider>",
    );
  return runtime;
}
