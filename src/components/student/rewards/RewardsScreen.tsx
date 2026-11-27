"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { rewardItem, rewardReveal } from "@/design-system/motion/presets";
import { allLessons } from "@/features/learning/content/catalog";
import { useLearningRuntime } from "@/features/learning/runtime";
import { APP_TIME_ZONE, totalStars } from "@/features/learning/progress/calc";
import { REWARDS, rewardById } from "@/features/learning/progress/rewards";
import { useStudent } from "@/features/learning/student-context";
import type { Catalog } from "@/features/learning/types";
import { useAudio } from "@/lib/audio";

import { LittleIllustration } from "../../ui/LittleIllustration";
import { StudentScreen } from "../StudentScreen";
import { BadgeTile } from "./BadgeTile";

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    timeZone: APP_TIME_ZONE,
  });

/** Screen 09 — stars, badges and history. No streaks, no leaderboards. */
export function RewardsScreen({ catalog }: { catalog: Catalog }) {
  const { progress } = useStudent();
  const { playSfx, unlocked } = useAudio();
  const runtime = useLearningRuntime();
  const lessonTitles = useMemo(
    () => new Map(allLessons(catalog).map((l) => [l.id, l.title])),
    [catalog],
  );

  // Badges earned since the last visit are celebrated once. "Last seen" is
  // captured when the screen opens (server value), then updated server-side.
  const [seenAt] = useState(() => progress.rewardsSeenAt);
  const fresh = useMemo(
    () =>
      new Set(
        progress.rewards
          .filter((r) => !seenAt || Date.parse(r.earnedAt) > Date.parse(seenAt))
          .map((r) => r.id),
      ),
    [progress.rewards, seenAt],
  );
  useEffect(() => {
    void runtime.markRewardsSeen();
  }, [runtime]);
  const hasFresh = fresh.size > 0;
  useEffect(() => {
    if (unlocked && hasFresh) playSfx("reward");
  }, [unlocked, hasFresh, playSfx]);

  const earned = new Map(progress.rewards.map((r) => [r.id, r.earnedAt]));
  const history = [...progress.history].reverse().slice(0, 12);

  return (
    <StudentScreen backHref="/student/home" backLabel="Về trang chủ">
      <div className="flex flex-col gap-6 pb-6">
        <section className="flex flex-wrap items-center gap-4 rounded-xl bg-yellow-50 p-5 shadow-sm">
          <span className="w-24">
            <LittleIllustration name="reward.sticker-star" decorative />
          </span>
          <div>
            <h1 className="text-display">Phần thưởng của con</h1>
            <p className="flex items-center gap-2 text-h2">
              <Star
                aria-hidden
                className="size-7 fill-yellow text-yellow-strong"
              />{" "}
              {totalStars(progress)} ngôi sao
            </p>
          </div>
        </section>

        <section aria-labelledby="badges-title" className="flex flex-col gap-3">
          <h2 id="badges-title" className="text-h1">
            Huy hiệu
          </h2>
          <motion.ul
            variants={rewardReveal}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-6"
          >
            {REWARDS.map((r) => (
              <motion.li key={r.id} variants={rewardItem}>
                <BadgeTile
                  reward={r}
                  earnedAt={earned.get(r.id)}
                  progress={r.progress(progress, catalog)}
                  isNew={fresh.has(r.id)}
                />
              </motion.li>
            ))}
          </motion.ul>
        </section>

        <section
          aria-labelledby="history-title"
          className="flex flex-col gap-3"
        >
          <h2 id="history-title" className="text-h1">
            Hành trình gần đây
          </h2>
          {history.length === 0 ? (
            <p className="rounded-lg bg-surface p-4 text-body-lg text-ink-muted shadow-xs">
              Khi con học xong một bài, ngôi sao sẽ xuất hiện ở đây.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-lg bg-surface shadow-xs">
              {history.map((e, i) => (
                <li
                  key={`${e.at}-${i}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-body-lg font-semibold">
                    {e.type === "lesson"
                      ? `Học xong “${lessonTitles.get(e.lessonId) ?? e.lessonId}”`
                      : `Nhận huy hiệu ${rewardById(e.rewardId).name}`}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-body-sm text-ink-muted">
                    {e.type === "lesson" && (
                      <span className="flex items-center gap-1 font-bold text-yellow-strong">
                        <Star aria-hidden className="size-4 fill-yellow" />{" "}
                        {e.stars}
                      </span>
                    )}
                    {formatDay(e.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </StudentScreen>
  );
}
