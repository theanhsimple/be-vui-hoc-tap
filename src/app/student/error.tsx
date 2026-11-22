"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { StudentShell } from "@/components/layout/StudentShell";
import { LittleMascot } from "@/components/learning/LittleMascot";
import { LittleButton } from "@/components/ui/LittleButton";

/** Calm recovery screen when learning data cannot be loaded. */
export default function StudentError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StudentShell align="center">
      <div
        role="alert"
        className="flex flex-col items-center gap-4 text-center"
      >
        <LittleMascot state="think" className="size-32" />
        <h1 className="text-display">Ôi, có chút trục trặc!</h1>
        <p className="text-h3 text-ink-muted">
          Mình chưa tải được bài học. Con nhờ bố mẹ thử lại nhé.
        </p>
        <LittleButton
          size="xl"
          iconStart={<RotateCcw />}
          onClick={() => retry()}
        >
          Thử lại
        </LittleButton>
      </div>
    </StudentShell>
  );
}
