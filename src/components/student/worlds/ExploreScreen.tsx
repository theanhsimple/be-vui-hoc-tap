"use client";

import { useStudent } from "@/features/learning/student-context";
import type { Catalog } from "@/features/learning/types";

import { AudioPlayer } from "../../learning/AudioPlayer";
import { lockedHintFor } from "../home/HomeScreen";
import { StudentScreen } from "../StudentScreen";
import { WorldCard } from "./WorldCard";

const TITLE = "Con muốn khám phá thế giới nào?";

/** Screen 04 — the seven learning worlds. */
export function ExploreScreen({ catalog }: { catalog: Catalog }) {
  const { progress, worldStates } = useStudent();
  const done = Object.keys(progress.lessons).length;
  return (
    <StudentScreen backHref="/student/home" backLabel="Về trang chủ">
      <div className="flex flex-col gap-5 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-display">{TITLE}</h1>
          <AudioPlayer
            source={{ text: TITLE, lang: "vi-VN" }}
            autoPlay
            demo
            size="lg"
          />
        </div>
        <ul className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
          {catalog.worlds.map((w) => {
            const ws = worldStates[w.id];
            return (
              <li key={w.id}>
                <WorldCard
                  world={w}
                  state={ws?.state ?? "locked"}
                  completed={ws?.completed ?? 0}
                  total={ws?.total ?? 0}
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
      </div>
    </StudentScreen>
  );
}
