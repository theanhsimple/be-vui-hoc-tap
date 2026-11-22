"use client";

import { useRouter } from "next/navigation";

import { useStudent } from "@/features/learning/student-context";
import type { World } from "@/features/learning/types";
import { cn } from "@/lib/cn";

import { AudioInstruction } from "../../learning/AudioInstruction";
import { LittleIllustration } from "../../ui/LittleIllustration";
import { LittleLinkButton } from "../../ui/LittleLinkButton";
import { LittleProgress } from "../../ui/LittleProgress";
import { LittleStatePanel } from "../../ui/LittleStatePanel";
import { StudentScreen } from "../StudentScreen";
import { LessonPath } from "./LessonPath";

const HERO = {
  blue: "bg-blue-50",
  yellow: "bg-yellow-50",
  coral: "bg-coral-50",
  mint: "bg-mint-50",
  lavender: "bg-lavender-50",
} as const;
const BAR = {
  blue: "blue",
  yellow: "yellow",
  coral: "coral",
  mint: "mint",
  lavender: "lavender",
} as const;

/** Screen 05 — the learning journey inside one world. */
export function WorldDetailScreen({ world }: { world: World }) {
  const { progress, worldStates, lessonStates } = useStudent();
  const router = useRouter();
  const ws = worldStates[world.id];
  const state = ws?.state ?? "locked";
  const completed = ws?.completed ?? 0;
  const total = ws?.total ?? 0;

  return (
    <StudentScreen backHref="/student/explore" backLabel="Về các thế giới">
      {state === "locked" ? (
        <LittleStatePanel
          kind="empty"
          title={`${world.nameVi} chưa mở`}
          description="Con học thêm vài bài ở các thế giới khác để mở nơi này nhé."
          action={
            <LittleLinkButton href="/student/explore" size="lg">
              Về các thế giới
            </LittleLinkButton>
          }
        />
      ) : (
        <div className="flex flex-col gap-6 pb-6">
          <section
            className={cn(
              "grid grid-cols-1 items-center gap-4 rounded-xl p-5 shadow-sm tablet:grid-cols-[200px_minmax(0,1fr)] tablet:p-6",
              HERO[world.tone],
            )}
          >
            <span className="mx-auto w-40 tablet:w-full">
              <LittleIllustration
                name={world.illustration}
                alt={world.nameVi}
                priority
              />
            </span>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-body-sm font-bold text-ink-muted">
                  {world.category}
                </p>
                <h1 className="text-display">{world.nameVi}</h1>
              </div>
              <AudioInstruction
                text={world.description}
                mascotState="talk"
                demo
              />
              <LittleProgress
                label="Hành trình của con"
                value={completed}
                max={total}
                valueText={`${completed}/${total} bài`}
                tone={BAR[world.tone]}
              />
            </div>
          </section>

          {world.skills.map((skill) => (
            <section
              key={skill.id}
              aria-labelledby={`${skill.id}-title`}
              className="flex flex-col gap-3"
            >
              <h2 id={`${skill.id}-title`} className="text-h2">
                {skill.title}
              </h2>
              <LessonPath
                tone={world.tone}
                lessons={skill.lessons.map((l) => ({
                  lesson: l,
                  state: lessonStates[l.id] ?? "locked",
                  stars: progress.lessons[l.id]?.bestStars ?? 0,
                }))}
                onOpen={(id) => router.push(`/student/lessons/${id}`)}
              />
            </section>
          ))}
        </div>
      )}
    </StudentScreen>
  );
}
