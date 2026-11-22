"use client";

import { ArrowRight, House, Trophy } from "lucide-react";
import { useEffect, useRef } from "react";

import { rewardById } from "@/features/learning/progress/rewards";
import { useStudent } from "@/features/learning/store/hooks";
import type { LessonSummary, World } from "@/features/learning/types";
import { useAudio } from "@/lib/audio";

import { LittleMascot } from "../../learning/LittleMascot";
import { RewardPanel } from "../../learning/RewardPanel";
import { LittleLinkButton } from "../../ui/LittleLinkButton";
import { LittleStatePanel } from "../../ui/LittleStatePanel";
import { BadgeTile } from "../rewards/BadgeTile";
import { StudentScreen } from "../StudentScreen";

/** Screen 08 — celebrate effort; no ranking, no "smart/weak" labels. */
export function LessonResultScreen({
  lesson,
  world,
}: {
  lesson: LessonSummary;
  world: World;
}) {
  const ctx = useStudent();
  const { play, playSfx, unlocked } = useAudio();
  const celebrated = useRef(false);
  const record = ctx?.progress.lessons[lesson.id];
  const message = record
    ? record.last.firstTry === record.last.total
      ? "Con đã hoàn thành hành trình hôm nay!"
      : "Con đã rất cố gắng. Cùng khám phá thêm nhé!"
    : "";

  useEffect(() => {
    if (!record || celebrated.current || !unlocked) return;
    celebrated.current = true;
    playSfx("reward");
    void play({ text: message, lang: "vi-VN" });
  }, [record, unlocked, message, play, playSfx]);

  if (!ctx) return <StudentScreen loading>{null}</StudentScreen>;
  if (!record) {
    return (
      <StudentScreen backHref={`/student/worlds/${world.id}`}>
        <LittleStatePanel
          kind="empty"
          title="Chưa có kết quả cho bài này"
          description="Con hãy học bài này trước nhé."
          action={
            <LittleLinkButton href={`/student/lessons/${lesson.id}`} size="lg">
              Học bài này
            </LittleLinkButton>
          }
        />
      </StudentScreen>
    );
  }

  const { last } = record;
  return (
    <StudentScreen align="center">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <RewardPanel
          title={message}
          starsEarned={last.stars}
          sticker={{ illustration: "reward.sticker-star", label: lesson.title }}
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <LittleMascot state="cheer" className="size-16" />
          <p className="rounded-pill bg-surface px-4 py-2 text-body-lg font-bold shadow-xs">
            Hoàn thành {last.total}/{last.total} câu
          </p>
          <p className="rounded-pill bg-surface px-4 py-2 text-body-lg font-bold shadow-xs">
            Trả lời đúng {last.correct} câu
          </p>
        </div>

        {last.newRewards.length > 0 && (
          <section
            aria-labelledby="new-badges"
            className="flex flex-col items-center gap-3"
          >
            <h2 id="new-badges" className="text-h2">
              Con nhận được huy hiệu mới!
            </h2>
            <ul className="flex flex-wrap justify-center gap-3">
              {last.newRewards.map((id) => (
                <li key={id} className="w-44">
                  <BadgeTile
                    reward={rewardById(id)}
                    earnedAt={record.lastCompletedAt}
                    isNew
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <LittleLinkButton
            href={`/student/worlds/${world.id}`}
            size="xl"
            iconEnd={<ArrowRight strokeWidth={3} />}
          >
            Tiếp tục khám phá
          </LittleLinkButton>
          <LittleLinkButton
            href="/student/rewards"
            size="lg"
            variant="reward"
            iconStart={<Trophy />}
          >
            Xem phần thưởng
          </LittleLinkButton>
          <LittleLinkButton
            href="/student/home"
            size="lg"
            variant="secondary"
            iconStart={<House />}
          >
            Về trang chủ
          </LittleLinkButton>
        </div>
      </div>
    </StudentScreen>
  );
}
