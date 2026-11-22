"use client";

import { Lock } from "lucide-react";
import { useState, useTransition } from "react";

import { selectChildAction } from "@/features/family/actions";
import { useAudio } from "@/lib/audio";

import { AudioPlayer } from "../learning/AudioPlayer";
import { type AvatarKey, LittleAvatar } from "../ui/LittleAvatar";
import { LittleSelectableCard } from "../ui/LittleCard";
import { LittleLinkButton } from "../ui/LittleLinkButton";
import { LittleStatePanel } from "../ui/LittleStatePanel";
import { StudentScreen } from "./StudentScreen";

const QUESTION = "Hôm nay ai sẽ khám phá?";

export interface ProfileChoice {
  id: string;
  nickname: string;
  avatar: AvatarKey;
  ageLabel?: string;
}

/**
 * Screen 02 — the signed-in family's active children (loaded on the server
 * under RLS). Choosing one sets an httpOnly cookie that the server re-checks.
 */
export function ProfilesScreen({
  profiles,
  selectedId,
}: {
  profiles: ProfileChoice[];
  selectedId?: string;
}) {
  const { play } = useAudio();
  const [pending, startTransition] = useTransition();
  const [choosing, setChoosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const state = { children: profiles, selectedChildId: choosing ?? selectedId };

  return (
    <StudentScreen backHref="/student/welcome" align="center">
      {
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
              description="Bố mẹ hãy tạo hồ sơ cho bé trong khu vực phụ huynh."
              action={
                <LittleLinkButton href="/parent/children/new" size="lg">
                  Tạo hồ sơ cho bé
                </LittleLinkButton>
              }
            />
          ) : (
            <ul className="grid w-full max-w-4xl grid-cols-1 gap-5 tablet:grid-cols-3">
              {state.children.map((child) => (
                <li key={child.id}>
                  <LittleSelectableCard
                    selected={state.selectedChildId === child.id}
                    aria-label={`${child.nickname}${child.ageLabel ? `, ${child.ageLabel}` : ""}`}
                    className="flex w-full flex-row items-center gap-4 tablet:flex-col tablet:py-8"
                    aria-busy={pending && choosing === child.id}
                    disabled={pending}
                    onClick={() => {
                      void play({
                        text: `Chào ${child.nickname}! Mình cùng học nhé!`,
                        lang: "vi-VN",
                      });
                      setChoosing(child.id);
                      setError(null);
                      startTransition(async () => {
                        const r = await selectChildAction(child.id);
                        if (r && !r.ok) {
                          setError(r.message);
                          setChoosing(null);
                        }
                      });
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

          {error && (
            <p
              role="alert"
              className="rounded-md bg-warning-50 p-3 text-body font-semibold text-warning-strong"
            >
              {error}
            </p>
          )}

          <p className="flex items-center gap-2 text-body-sm text-ink-muted">
            <Lock aria-hidden className="size-4" />
            Bố mẹ: thêm hoặc sửa hồ sơ trong khu vực phụ huynh.
          </p>
        </div>
      }
    </StudentScreen>
  );
}
