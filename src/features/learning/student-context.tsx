"use client";

import { createContext, type ReactNode, use, useEffect } from "react";

import { useAudio } from "@/lib/audio";

import type { StudentView } from "./backend/overview";

const StudentContext = createContext<StudentView | null>(null);

/**
 * Provides the server-built view of the selected child to the student
 * screens, and applies the child's sound preferences set by the parent.
 */
export function StudentProvider({
  view,
  children,
}: {
  view: StudentView;
  children: ReactNode;
}) {
  const { setVoiceEnabled, setSfxEnabled } = useAudio();
  const { voice, sounds } = view.child.preferences;
  useEffect(() => {
    setVoiceEnabled(voice);
    setSfxEnabled(sounds);
  }, [voice, sounds, setVoiceEnabled, setSfxEnabled]);
  return <StudentContext value={view}>{children}</StudentContext>;
}

export function useStudent(): StudentView {
  const view = use(StudentContext);
  if (!view)
    throw new Error("useStudent must be used inside <StudentProvider>");
  return view;
}
