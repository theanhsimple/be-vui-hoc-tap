import { Lightbulb } from "lucide-react";

import { LittleBadge } from "../ui/LittleBadge";
import { LittleCard } from "../ui/LittleCard";
import { MASTERY_LABEL, MASTERY_TONE, type MasteryBand } from "./mastery";
import { MasteryMeter } from "./MasteryMeter";

export interface SkillProgressCardProps {
  skill: string;
  domain: string;
  band: MasteryBand;
  /** Plain-language observation, e.g. "Bé đếm chắc chắn đến 10." */
  observation?: string;
  /** Suggested at-home activity. */
  homeActivity?: string;
}

/** Skill observation for parents: band + description + home idea. No scores. */
export function SkillProgressCard({
  skill,
  domain,
  band,
  observation,
  homeActivity,
}: SkillProgressCardProps) {
  return (
    <LittleCard className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-caption text-ink-muted uppercase">{domain}</p>
          <h3 className="text-h3">{skill}</h3>
        </div>
        <LittleBadge tone={MASTERY_TONE[band]}>
          {MASTERY_LABEL[band]}
        </LittleBadge>
      </div>
      <MasteryMeter band={band} />
      {observation && <p className="text-body">{observation}</p>}
      {homeActivity && (
        <p className="flex gap-2 rounded-md bg-yellow-50 p-3 text-body-sm">
          <Lightbulb
            aria-hidden
            className="size-5 shrink-0 text-yellow-strong"
          />
          <span>
            <span className="font-bold">Gợi ý ở nhà: </span>
            {homeActivity}
          </span>
        </p>
      )}
    </LittleCard>
  );
}
