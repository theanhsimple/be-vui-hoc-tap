import { Clock, Star } from "lucide-react";

import type { LearningWorld } from "@/design-system/worlds";

import { LittleBadge } from "../ui/LittleBadge";
import { LittleCard } from "../ui/LittleCard";
import { LittleIllustration } from "../ui/LittleIllustration";

export interface LearningActivityCardProps {
  title: string;
  world: LearningWorld;
  /** e.g. "Hôm nay, 17:20". */
  when: string;
  /** e.g. "8 phút". */
  duration: string;
  stars?: number;
  status: "completed" | "in_progress";
}

export function LearningActivityCard({
  title,
  world,
  when,
  duration,
  stars,
  status,
}: LearningActivityCardProps) {
  return (
    <LittleCard padding="sm" className="flex items-center gap-4">
      <span className="w-16 shrink-0">
        <LittleIllustration name={world.illustration} decorative />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-caption text-ink-muted">{world.nameVi}</p>
        <h3 className="truncate text-body-lg">{title}</h3>
        <p className="flex flex-wrap items-center gap-x-3 text-body-sm text-ink-muted">
          <span>{when}</span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="size-4" /> {duration}
          </span>
          {stars !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Star
                aria-hidden
                className="size-4 fill-yellow text-yellow-strong"
              />{" "}
              {stars} sao
            </span>
          )}
        </p>
      </div>
      <LittleBadge tone={status === "completed" ? "success" : "info"} size="sm">
        {status === "completed" ? "Hoàn thành" : "Đang học"}
      </LittleBadge>
    </LittleCard>
  );
}
