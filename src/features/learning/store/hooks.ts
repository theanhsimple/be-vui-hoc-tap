"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { type ChildProgress, emptyProgress } from "../progress/model";
import { type DemoChild, type DemoState, demoStore } from "./demoStore";

/** The demo store; null during server rendering and the first client render. */
export function useDemoState(): DemoState | null {
  return useSyncExternalStore<DemoState | null>(
    demoStore.subscribe,
    demoStore.getSnapshot,
    demoStore.getServerSnapshot,
  );
}

export interface StudentContext {
  child: DemoChild;
  progress: ChildProgress;
}

/**
 * The selected child and their progress. Redirects to profile selection when
 * nobody is selected. Returns null while loading or redirecting.
 */
export function useStudent(): StudentContext | null {
  const state = useDemoState();
  const router = useRouter();
  const child = state?.children.find((c) => c.id === state.selectedChildId);
  useEffect(() => {
    if (state && !child) router.replace("/student/profiles");
  }, [state, child, router]);
  if (!state || !child) return null;
  return { child, progress: state.progress[child.id] ?? emptyProgress() };
}
