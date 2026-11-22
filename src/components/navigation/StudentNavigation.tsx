"use client";

import { ChevronLeft, Lock } from "lucide-react";
import { type ReactNode, useState } from "react";

import { LittleIconButton } from "../ui/LittleIconButton";
import { ParentGate } from "./ParentGate";

export interface StudentNavigationProps {
  /** Back to the previous child screen. Omit on the top-level screen. */
  onBack?: () => void;
  backLabel?: string;
  /** Centre slot, usually <LearningProgress>. */
  center?: ReactNode;
  /** Called only after the parent gate is passed. */
  onParentAccess: () => void;
  /** Replaces the back button (e.g. the child's avatar on the home screen). */
  start?: ReactNode;
  /** Extra child actions before the parent lock (e.g. rewards). */
  end?: ReactNode;
}

/**
 * Student top bar: one large back button, a centre slot, and the parent-area
 * lock. The lock is an adult control (48 px, corner) behind the parent gate.
 */
export function StudentNavigation({
  onBack,
  backLabel = "Quay lại",
  center,
  onParentAccess,
  start,
  end,
}: StudentNavigationProps) {
  const [gateOpen, setGateOpen] = useState(false);
  return (
    <nav
      aria-label="Điều hướng của bé"
      className="flex min-h-16 w-full items-center justify-between gap-2 tablet:gap-3"
    >
      <div className="flex shrink-0 items-center gap-2 tablet:min-w-16">
        {start}
        {!start && onBack && (
          <LittleIconButton
            label={backLabel}
            icon={<ChevronLeft strokeWidth={3} />}
            size="xl"
            onClick={onBack}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 justify-center">{center}</div>
      <div className="flex shrink-0 items-center justify-end gap-2 tablet:min-w-16">
        {end}
        <LittleIconButton
          label="Khu vực phụ huynh"
          icon={<Lock />}
          size="md"
          variant="secondary"
          onClick={() => setGateOpen(true)}
        />
      </div>
      <ParentGate
        open={gateOpen}
        onCancel={() => setGateOpen(false)}
        onPass={() => {
          setGateOpen(false);
          onParentAccess();
        }}
      />
    </nav>
  );
}
