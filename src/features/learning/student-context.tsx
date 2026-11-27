"use client";

import { createContext, type ReactNode, use, useEffect } from "react";

import { BreakReminder } from "@/components/student/break/BreakReminder";
import { useAudio } from "@/lib/audio";

import type { StudentView } from "./backend/overview";

const StudentContext = createContext<StudentView | null>(null);

/**
 * Provides the server-built view of the selected child to the student
 * screens, applies the child's sound preferences set by the parent and
 * shows the break reminder when the parent set a time limit.
 */
export function StudentProvider({
  view,
  children,
}: {
  view: StudentView;
  children: ReactNode;
}) {
  const { setVoiceEnabled, setSfxEnabled } = useAudio();
  const { voice, sounds, sessionMinutes } = view.child.preferences;
  useEffect(() => {
    setVoiceEnabled(voice);
    setSfxEnabled(sounds);
  }, [voice, sounds, setVoiceEnabled, setSfxEnabled]);
  return (
    <StudentContext value={view}>
      {children}
      {sessionMinutes && (
        <BreakReminder childId={view.child.id} minutes={sessionMinutes} />
      )}
    </StudentContext>
  );
}

export function useStudent(): StudentView {
  const view = use(StudentContext);
  if (!view)
    throw new Error("useStudent must be used inside <StudentProvider>");
  return view;
}
