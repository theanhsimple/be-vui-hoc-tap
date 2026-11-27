import type { ReactNode } from "react";
import { vi } from "vitest";

import {
  type LearningRuntime,
  LearningRuntimeProvider,
} from "@/features/learning/runtime";

/** A LearningRuntime for component tests; every action is a vi.fn(). */
export function testRuntime(
  overrides: Partial<LearningRuntime> = {},
): LearningRuntime {
  return {
    edition: "server",
    startLesson: vi.fn(async () => undefined),
    submitAnswer: vi.fn(async () => ({ ok: false as const, code: "unset" })),
    requestHint: vi.fn(async () => ({ ok: false as const, code: "unset" })),
    markRewardsSeen: vi.fn(async () => undefined),
    selectChild: vi.fn(async () => undefined),
    leaveStudent: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    submitPlacement: vi.fn(async () => ({ ok: false as const, code: "unset" })),
    links: {
      parentHome: "/parent",
      childReport: (id: string) => `/parent/children/${id}`,
    },
    ...overrides,
  };
}

export function withRuntime(runtime: LearningRuntime) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LearningRuntimeProvider runtime={runtime}>
        {children}
      </LearningRuntimeProvider>
    );
  };
}
