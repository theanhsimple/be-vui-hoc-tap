"use client";

import type { ReactNode } from "react";

import { signOutAction } from "@/features/auth/actions";
import {
  leaveStudentAction,
  selectChildAction,
} from "@/features/family/actions";

import {
  markRewardsSeenAction,
  requestHintAction,
  startLessonAction,
  submitAnswerAction,
  submitPlacementAction,
} from "./backend/actions";
import { type LearningRuntime, LearningRuntimeProvider } from "./runtime";

const SERVER_RUNTIME: LearningRuntime = {
  edition: "server",
  startLesson: (input) => startLessonAction(input),
  submitAnswer: (input) => submitAnswerAction(input),
  requestHint: (input) => requestHintAction(input),
  markRewardsSeen: () => markRewardsSeenAction(),
  selectChild: (childId) => selectChildAction(childId),
  leaveStudent: () => leaveStudentAction(),
  signOut: () => signOutAction(),
  submitPlacement: (input) => submitPlacementAction(input),
  links: {
    parentHome: "/parent",
    childReport: (id, saved) =>
      `/parent/children/${id}${saved ? `?saved=${saved}` : ""}`,
  },
};

/** Server edition: learning actions are Server Functions backed by Supabase. */
export function ServerRuntimeProvider({ children }: { children: ReactNode }) {
  return (
    <LearningRuntimeProvider runtime={SERVER_RUNTIME}>
      {children}
    </LearningRuntimeProvider>
  );
}
