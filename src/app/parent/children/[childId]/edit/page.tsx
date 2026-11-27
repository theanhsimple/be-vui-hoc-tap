import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { ArchiveChild } from "@/components/parent/ChildActions";
import { ChildForm } from "@/components/parent/ChildForm";
import { ParentFrame } from "@/components/parent/ParentFrame";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { updateChildAction } from "@/features/family/actions";
import { getChild, requireFamily } from "@/features/family/queries";

export const metadata: Metadata = { title: "Sửa hồ sơ của bé" };

export default function EditChildPage(
  props: PageProps<"/parent/children/[childId]/edit">,
) {
  return (
    <ParentFrame currentId="family">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <Edit {...props} />
      </Suspense>
    </ParentFrame>
  );
}

async function Edit({ params }: PageProps<"/parent/children/[childId]/edit">) {
  const { childId } = await params;
  await requireFamily(`/parent/children/${childId}/edit`);
  const child = await getChild(childId);
  if (!child) notFound();
  if (child.status === "archived") redirect(`/parent/children/${child.id}`);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <LittleLinkButton href={`/parent/children/${child.id}`} variant="ghost">
          ← Tiến độ của {child.nickname}
        </LittleLinkButton>
      </div>
      <LittleCard padding="lg" className="flex flex-col gap-4">
        <h1 className="text-h1">Sửa hồ sơ</h1>
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
            sessionMinutes: child.preferences.sessionMinutes,
          }}
        />
      </LittleCard>
      <LittleCard className="flex flex-col gap-3">
        <h2 className="text-h3">Lưu trữ hồ sơ</h2>
        <ArchiveChild childId={child.id} nickname={child.nickname} />
      </LittleCard>
    </div>
  );
}
