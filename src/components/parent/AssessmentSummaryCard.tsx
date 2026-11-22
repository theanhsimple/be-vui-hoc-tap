import type { ReactNode } from "react";

import { LittleBadge } from "../ui/LittleBadge";
import { LittleCard } from "../ui/LittleCard";
import { MASTERY_LABEL, MASTERY_TONE, type MasteryBand } from "./mastery";

export interface AssessmentObservation {
  domain: string;
  band: MasteryBand;
  note?: string;
}

export interface AssessmentSummaryCardProps {
  title: string;
  /** e.g. "Ngày 12/11/2026". */
  date: string;
  observations: readonly AssessmentObservation[];
  action?: ReactNode;
}

/** Summary of a placement activity, framed as observations — not a test result. */
export function AssessmentSummaryCard({
  title,
  date,
  observations,
  action,
}: AssessmentSummaryCardProps) {
  return (
    <LittleCard className="flex flex-col gap-4">
      <div>
        <h3 className="text-h3">{title}</h3>
        <p className="text-body-sm text-ink-muted">{date}</p>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {observations.map((o) => (
          <li
            key={o.domain}
            className="flex flex-wrap items-center justify-between gap-2 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-body font-bold">{o.domain}</p>
              {o.note && (
                <p className="text-body-sm text-ink-muted">{o.note}</p>
              )}
            </div>
            <LittleBadge tone={MASTERY_TONE[o.band]} size="sm">
              {MASTERY_LABEL[o.band]}
            </LittleBadge>
          </li>
        ))}
      </ul>
      <p className="rounded-md bg-surface-muted p-3 text-body-sm text-ink-muted">
        Đây là những quan sát ban đầu để chọn bài phù hợp cho bé, không phải
        điểm số hay xếp loại.
      </p>
      {action}
    </LittleCard>
  );
}
