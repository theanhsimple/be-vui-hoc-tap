"use client";

import { Play, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";

import { LittleButton } from "@/components/ui/LittleButton";
import { startPlacementAction } from "@/features/learning/backend/actions";

const MESSAGES: Record<string, string> = {
  forbidden: "Không tìm thấy hồ sơ của bé.",
  child_archived: "Hồ sơ này đã được lưu trữ.",
  assessment_not_found: "Hoạt động này hiện chưa có.",
};

/** Starts (or resumes / restarts) the placement activity for this child. */
export function PlacementStart({
  childId,
  nickname,
  activityId,
  openAt,
  total,
  done,
}: {
  childId: string;
  nickname: string;
  activityId: string;
  /** Index of the next question of an unfinished run, or null. */
  openAt: number | null;
  total: number;
  /** The child has finished this activity before. */
  done: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const go = (restart: boolean) =>
    start(async () => {
      setError(null);
      const r = await startPlacementAction({ childId, activityId, restart });
      if (r && !r.ok)
        setError(MESSAGES[r.code] ?? "Chưa bắt đầu được. Vui lòng thử lại.");
    });

  return (
    <div className="flex flex-col gap-3">
      {openAt !== null && (
        <p className="text-body font-semibold">
          {nickname} đang làm dở: đã xong {openAt}/{total} câu.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <LittleButton
          size="lg"
          iconStart={<Play />}
          loading={pending}
          onClick={() => go(false)}
        >
          {openAt !== null
            ? "Chơi tiếp cùng bé"
            : done
              ? "Làm lại cùng bé"
              : "Bắt đầu cùng bé"}
        </LittleButton>
        {openAt !== null && (
          <LittleButton
            size="lg"
            variant="secondary"
            iconStart={<RotateCcw />}
            disabled={pending}
            onClick={() => go(true)}
          >
            Bắt đầu lại từ đầu
          </LittleButton>
        )}
      </div>
      {error && (
        <p role="alert" className="text-body font-semibold text-error-strong">
          {error}
        </p>
      )}
    </div>
  );
}
