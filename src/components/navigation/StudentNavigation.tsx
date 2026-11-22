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
}: StudentNavigationProps) {
  const [gateOpen, setGateOpen] = useState(false);
  return (
    <nav
      aria-label="Điều hướng của bé"
      className="flex min-h-16 w-full items-center justify-between gap-2 tablet:gap-3"
    >
      <div className="shrink-0 tablet:w-16">
        {onBack && (
          <LittleIconButton
            label={backLabel}
            icon={<ChevronLeft strokeWidth={3} />}
            size="xl"
            onClick={onBack}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 justify-center">{center}</div>
      <div className="flex shrink-0 justify-end tablet:w-16">
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
