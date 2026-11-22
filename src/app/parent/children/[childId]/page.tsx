import { Star } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  ArchiveChild,
  StartLearningButton,
} from "@/components/parent/ChildActions";
import { ChildForm } from "@/components/parent/ChildForm";
import { LittleAvatar } from "@/components/ui/LittleAvatar";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { updateChildAction } from "@/features/family/actions";
import { ageLabel, getChild, requireFamily } from "@/features/family/queries";
import { fetchOverview } from "@/features/learning/backend/student";
import { ParentFrame } from "@/components/parent/ParentFrame";

export const metadata: Metadata = { title: "Hồ sơ của bé" };

export default function ChildPage(
  props: PageProps<"/parent/children/[childId]">,
) {
  return (
    <ParentFrame currentId="family">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <Child {...props} />
      </Suspense>
    </ParentFrame>
  );
}

async function Child({ params }: PageProps<"/parent/children/[childId]">) {
  const { childId } = await params;
  await requireFamily(`/parent/children/${childId}`);
  // RLS: a child of another family is simply not found.
  const child = await getChild(childId);
  if (!child) notFound();

  const archived = child.status === "archived";
  const overview = archived ? null : await fetchOverview(child.id);
  const completed = overview?.lessons.filter((l) => l.record).length ?? 0;
  const stars =
    overview?.lessons.reduce((s, l) => s + (l.record?.bestStars ?? 0), 0) ?? 0;
  const badges = overview?.rewards.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <LittleCard className="flex flex-wrap items-center gap-4">
        <LittleAvatar
          name={child.nickname}
          avatar={child.avatar}
          size="xl"
          decorative
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-h1">{child.nickname}</h1>
          <p className="text-body text-ink-muted">
            {ageLabel(child.birthYear) || "Chưa có năm sinh"}
            {archived && " · Đã lưu trữ"}
          </p>
        </div>
        {!archived && (
          <StartLearningButton childId={child.id} nickname={child.nickname} />
        )}
      </LittleCard>

      {overview && (
        <dl className="grid grid-cols-3 gap-3">
          {[
            ["Bài đã học", completed],
            ["Ngôi sao", stars],
            ["Huy hiệu", badges],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-md bg-surface p-3 shadow-xs"
            >
              <dt className="text-body-sm text-ink-muted">{label}</dt>
              <dd className="flex items-center gap-1 text-h2">
                {label === "Ngôi sao" && (
                  <Star
                    aria-hidden
                    className="size-5 fill-yellow text-yellow-strong"
                  />
                )}
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {archived ? (
        <LittleStatePanel
          kind="empty"
          title="Hồ sơ đã được lưu trữ"
          description="Kết quả học tập vẫn được giữ lại. Khôi phục hồ sơ sẽ có trong phiên bản sau."
        />
      ) : (
        <>
          <LittleCard padding="lg" className="flex flex-col gap-4">
            <h2 className="text-h2">Sửa hồ sơ</h2>
            <ChildForm
              action={updateChildAction.bind(null, child.id)}
              submitLabel="Lưu thay đổi"
              currentYear={new Date().getUTCFullYear()}
              initial={{
                nickname: child.nickname,
                avatar: child.avatar,
                birthYear: child.birthYear,
                voice: child.preferences.voice,
                sounds: child.preferences.sounds,
              }}
            />
          </LittleCard>
          <LittleCard className="flex flex-col gap-3">
            <h2 className="text-h3">Lưu trữ hồ sơ</h2>
            <ArchiveChild childId={child.id} nickname={child.nickname} />
          </LittleCard>
        </>
      )}
    </div>
  );
}
