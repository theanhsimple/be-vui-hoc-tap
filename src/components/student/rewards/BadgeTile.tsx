import { Lock } from "lucide-react";

import type { RewardDefinition } from "@/features/learning/progress/rewards";
import { cn } from "@/lib/cn";

import { LittleIllustration } from "../../ui/LittleIllustration";

export interface BadgeTileProps {
  reward: RewardDefinition;
  earnedAt?: string;
  progress?: { current: number; target: number };
  isNew?: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
  });

/** One achievement. Locked badges show how to earn them — never what was "missed". */
export function BadgeTile({
  reward,
  earnedAt,
  progress,
  isNew,
}: BadgeTileProps) {
  const earned = !!earnedAt;
  return (
    <div
      data-earned={earned}
      className={cn(
        "flex h-full flex-col items-center gap-2 rounded-xl p-4 text-center shadow-sm",
        earned ? "bg-surface" : "bg-surface-muted",
        isNew && "ring-4 ring-yellow",
      )}
    >
      <span
        className={cn("relative block w-24", !earned && "opacity-40 grayscale")}
      >
        <LittleIllustration name={reward.illustration} alt={reward.name} />
        {!earned && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-10 place-items-center rounded-pill bg-surface text-ink-muted shadow-sm">
              <Lock aria-hidden className="size-5" />
            </span>
          </span>
        )}
      </span>
      <p className="text-body-lg font-extrabold">{reward.name}</p>
      <p className="text-caption text-ink-muted">{reward.nameEn}</p>
      <p className="text-body-sm text-ink-muted">
        {earned ? `Nhận ngày ${formatDate(earnedAt)}` : reward.criteria}
      </p>
      {!earned && progress && (
        <p
          aria-label={`Tiến độ ${progress.current} trên ${progress.target}`}
          className="text-caption font-bold text-blue-strong"
        >
          {progress.current}/{progress.target}
        </p>
      )}
    </div>
  );
}
