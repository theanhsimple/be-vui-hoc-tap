"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

import { demoStore } from "@/features/learning/store/demoStore";
import { useDemoState } from "@/features/learning/store/hooks";
import { useAudio } from "@/lib/audio";

import { AudioPlayer } from "../learning/AudioPlayer";
import { LittleAvatar } from "../ui/LittleAvatar";
import { LittleBadge } from "../ui/LittleBadge";
import { LittleSelectableCard } from "../ui/LittleCard";
import { LittleStatePanel } from "../ui/LittleStatePanel";
import { StudentScreen } from "./StudentScreen";

const QUESTION = "Hôm nay ai sẽ khám phá?";

/** Screen 02 — only this family's children (demo: this device's demo family). */
export function ProfilesScreen() {
  const state = useDemoState();
  const router = useRouter();
  const { play } = useAudio();

  return (
    <StudentScreen backHref="/student/welcome" loading={!state} align="center">
      {state && (
        <div className="flex flex-col items-center gap-8 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-display">{QUESTION}</h1>
            <AudioPlayer
              source={{ text: QUESTION, lang: "vi-VN" }}
              autoPlay
              demo
              size="lg"
            />
          </div>

          {state.children.length === 0 ? (
            <LittleStatePanel
              kind="empty"
              title="Chưa có hồ sơ của bé"
              description="Bố mẹ hãy tạo hồ sơ cho bé trong khu vực phụ huynh (biểu tượng ổ khoá ở góc trên)."
            />
          ) : (
            <ul className="grid w-full max-w-4xl grid-cols-1 gap-5 tablet:grid-cols-3">
              {state.children.map((child) => (
                <li key={child.id}>
                  <LittleSelectableCard
                    selected={state.selectedChildId === child.id}
                    aria-label={`${child.nickname}${child.ageLabel ? `, ${child.ageLabel}` : ""}`}
                    className="flex w-full flex-row items-center gap-4 tablet:flex-col tablet:py-8"
                    onClick={() => {
                      void play({
                        text: `Chào ${child.nickname}! Mình cùng học nhé!`,
                        lang: "vi-VN",
                      });
                      demoStore.selectChild(child.id);
                      router.push("/student/home");
                    }}
                  >
                    <LittleAvatar
                      name={child.nickname}
                      avatar={child.avatar}
                      size="xl"
                      decorative
                    />
                    <span className="flex flex-col tablet:items-center">
                      <span className="text-h1">{child.nickname}</span>
                      {child.ageLabel && (
                        <span className="text-body-lg text-ink-muted">
                          {child.ageLabel}
                        </span>
                      )}
                    </span>
                  </LittleSelectableCard>
                </li>
              ))}
            </ul>
          )}

          <p className="flex items-center gap-2 text-body-sm text-ink-muted">
            <Lock aria-hidden className="size-4" />
            Bố mẹ: thêm hoặc sửa hồ sơ trong khu vực phụ huynh.
            <LittleBadge tone="neutral" size="sm">
              Hồ sơ demo
            </LittleBadge>
          </p>
        </div>
      )}
    </StudentScreen>
  );
}
