"use client";

import { Star } from "lucide-react";
import Link from "next/link";

import { allLessons, findWorld } from "@/features/learning/content/catalog";
import { greeting, totalStars } from "@/features/learning/progress/calc";
import { useStudent } from "@/features/learning/student-context";
import type { Catalog } from "@/features/learning/types";

import { AudioPlayer } from "../../learning/AudioPlayer";
import { LittleAvatar } from "../../ui/LittleAvatar";
import { StudentScreen } from "../StudentScreen";
import { WorldCard } from "../worlds/WorldCard";
import { ContinueCard } from "./ContinueCard";
import { DailyLearningCard } from "./DailyLearningCard";
import { DailyRewardCard } from "./DailyRewardCard";

export function lockedHintFor(min: number, done: number) {
  return `Học thêm ${Math.max(min - done, 0)} bài ở các thế giới khác để mở nhé.`;
}

/** Screen 03 — Student home. Data and the day's plan come from the server. */
export function HomeScreen({ catalog }: { catalog: Catalog }) {
  const { child, progress, worldStates, today, starsToday } = useStudent();
  const plan = progress.dailyPlan?.lessonIds ?? [];
  const hello = `${greeting(today.hour)}, ${child.nickname}!`;
  const lessons = allLessons(catalog);
  const done = Object.keys(progress.lessons).length;
  const inProgressLesson =
    progress.inProgress &&
    lessons.find((l) => l.id === progress.inProgress!.lessonId);

  return (
    <StudentScreen
      start={
        <Link
          href="/student/profiles"
          aria-label={`Đổi bạn học. Đang học: ${child.nickname}`}
          className="flex min-h-16 items-center gap-2 rounded-pill bg-surface py-1 pr-4 pl-1 shadow-sm"
        >
          <LittleAvatar
            name={child.nickname}
            avatar={child.avatar}
            size="md"
            decorative
          />
          <span className="hidden text-body-lg font-extrabold tablet:inline">
            {child.nickname}
          </span>
        </Link>
      }
      end={
        <Link
          href="/student/rewards"
          aria-label={`Phần thưởng: ${totalStars(progress)} ngôi sao`}
          className="flex min-h-16 items-center gap-2 rounded-pill bg-yellow px-4 text-h3 shadow-sm"
        >
          <Star
            aria-hidden
            className="size-6 fill-surface text-yellow-strong"
          />
          {totalStars(progress)}
        </Link>
      }
    >
      <div className="flex flex-col gap-6 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-display">{hello}</h1>
          <AudioPlayer
            source={{ text: hello, lang: "vi-VN" }}
            autoPlay
            demo
            size="lg"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 desktop:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <DailyLearningCard
            catalog={catalog}
            progress={progress}
            planIds={plan}
            today={today.date}
          />
          <div className="flex flex-col gap-5">
            {inProgressLesson && progress.inProgress && (
              <ContinueCard
                lesson={inProgressLesson}
                worldName={
                  findWorld(catalog, inProgressLesson.worldId)?.nameVi ?? ""
                }
                answered={progress.inProgress.questionIndex}
              />
            )}
            <DailyRewardCard
              todayStars={starsToday}
              total={totalStars(progress)}
            />
          </div>
        </div>

        <section aria-labelledby="worlds-title" className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <h2 id="worlds-title" className="text-h1">
              Khám phá các thế giới
            </h2>
            <Link
              href="/student/explore"
              className="inline-flex min-h-12 items-center rounded-pill px-4 text-body-lg font-bold text-blue-strong hover:bg-blue-50"
            >
              Xem tất cả
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-4 desktop:grid-cols-7">
            {catalog.worlds.map((w) => {
              const ws = worldStates[w.id] ?? {
                state: "locked" as const,
                completed: 0,
                total: 0,
              };
              return (
                <li key={w.id}>
                  <WorldCard
                    world={w}
                    variant="tile"
                    state={ws.state}
                    completed={ws.completed}
                    total={ws.total}
                    lockedHint={
                      w.unlock
                        ? lockedHintFor(w.unlock.minCompletedLessons, done)
                        : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </StudentScreen>
  );
}
