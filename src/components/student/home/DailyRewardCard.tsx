import { Star } from "lucide-react";

import { starsOnDay, totalStars } from "@/features/learning/progress/calc";
import type { ChildProgress } from "@/features/learning/progress/model";

import { LittleLinkButton } from "../../ui/LittleLinkButton";
import { LittleIllustration } from "../../ui/LittleIllustration";

/** Gentle daily encouragement — celebrates what was done, never what was missed. */
export function DailyRewardCard({
  progress,
  today,
}: {
  progress: ChildProgress;
  today: string;
}) {
  const todayStars = starsOnDay(progress, today);
  return (
    <section
      aria-labelledby="daily-reward-title"
      className="flex flex-wrap items-center gap-4 rounded-xl bg-yellow-50 p-4 shadow-sm"
    >
      <span className="w-20 shrink-0">
        <LittleIllustration name="reward.sticker-star" decorative />
      </span>
      <div className="min-w-40 flex-1">
        <h2 id="daily-reward-title" className="text-h3">
          {todayStars > 0
            ? `Hôm nay con có ${todayStars} ngôi sao!`
            : "Mỗi bài học là một bước nhỏ."}
        </h2>
        <p className="flex items-center gap-1.5 text-body-sm text-ink-muted">
          <Star aria-hidden className="size-4 fill-yellow text-yellow-strong" />{" "}
          Tổng cộng {totalStars(progress)} ngôi sao
        </p>
      </div>
      <LittleLinkButton href="/student/rewards" variant="reward" size="lg">
        Xem quà
      </LittleLinkButton>
    </section>
  );
}
