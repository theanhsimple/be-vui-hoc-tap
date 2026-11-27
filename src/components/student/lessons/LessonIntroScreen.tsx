"use client";

import { ArrowRight, Clock, Puzzle, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";

import { useLearningRuntime } from "@/features/learning/runtime";
import { useStudent } from "@/features/learning/student-context";
import type { LessonSummary, World } from "@/features/learning/types";

import { AudioInstruction } from "../../learning/AudioInstruction";
import { LittleBadge } from "../../ui/LittleBadge";
import { LittleButton } from "../../ui/LittleButton";
import { LittleLinkButton } from "../../ui/LittleLinkButton";
import { LittleStatePanel } from "../../ui/LittleStatePanel";
import { StudentScreen } from "../StudentScreen";
import { VisualView } from "../VisualView";

/** Screen 06 — prepare the child before starting. */
export function LessonIntroScreen({
  lesson,
  world,
}: {
  lesson: LessonSummary;
  world: World;
}) {
  const { progress, lessonStates } = useStudent();
  const runtime = useLearningRuntime();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const back = `/student/worlds/${world.id}`;

  const state = lessonStates[lesson.id] ?? "locked";
  const resume =
    progress.inProgress?.lessonId === lesson.id
      ? progress.inProgress
      : undefined;
  // Starting creates/resumes the session on the server, then opens the player.
  const start = (restart: boolean) =>
    startTransition(async () => {
      setFailed(false);
      const result = await runtime.startLesson({
        lessonId: lesson.id,
        restart,
      });
      if (result && !result.ok) setFailed(true);
    });

  if (state === "locked") {
    return (
      <StudentScreen backHref={back} backLabel={`Về ${world.nameVi}`}>
        <LittleStatePanel
          kind="empty"
          title="Bài này chưa mở"
          description="Con học xong bài trước trong cùng chặng để mở bài này nhé."
          action={
            <LittleLinkButton href={back} size="lg">
              Về {world.nameVi}
            </LittleLinkButton>
          }
        />
      </StudentScreen>
    );
  }

  return (
    <StudentScreen
      backHref={back}
      backLabel={`Về ${world.nameVi}`}
      align="center"
    >
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 items-center gap-6 rounded-xl bg-surface p-5 shadow-sm tablet:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] tablet:p-8">
        <span className="mx-auto w-48 tablet:w-full">
          <VisualView visual={lesson.cover} label={lesson.title} priority />
        </span>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-body-sm font-bold text-ink-muted">
              {world.nameVi}
            </p>
            <h1 className="text-display">{lesson.title}</h1>
          </div>
          <AudioInstruction text={lesson.objective} autoPlay demo />
          <div className="flex flex-wrap gap-2">
            <LittleBadge tone="info" icon={<Clock />}>
              {lesson.minutes} phút
            </LittleBadge>
            <LittleBadge tone="creative" icon={<Puzzle />}>
              {lesson.questionCount} hoạt động
            </LittleBadge>
            {resume && (
              <LittleBadge tone="reward">
                Đã làm {resume.questionIndex}/{lesson.questionCount}
              </LittleBadge>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <LittleButton
              size="xl"
              iconEnd={<ArrowRight strokeWidth={3} />}
              loading={pending}
              onClick={() => start(false)}
            >
              {resume ? "Học tiếp nhé!" : "Cùng học nhé!"}
            </LittleButton>
            {resume && (
              <LittleButton
                size="lg"
                variant="secondary"
                iconStart={<RotateCcw />}
                disabled={pending}
                onClick={() => start(true)}
              >
                Học lại từ đầu
              </LittleButton>
            )}
          </div>
          {failed && (
            <p
              role="alert"
              className="rounded-md bg-warning-50 p-3 text-body font-semibold text-warning-strong"
            >
              Chưa mở được bài học. Con thử lại nhé.
            </p>
          )}
        </div>
      </div>
    </StudentScreen>
  );
}
