import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StartLearningButton } from "@/components/parent/ChildActions";
import { ArchivedChildActions } from "@/components/parent/ArchivedChildActions";
import { ChildDashboard } from "@/components/parent/ChildDashboard";
import { ParentFrame } from "@/components/parent/ParentFrame";
import { LittleAvatar } from "@/components/ui/LittleAvatar";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { ageLabel, getChild, requireFamily } from "@/features/family/queries";
import {
  getCatalog,
  getSkillGuides,
} from "@/features/learning/backend/content";
import { getChildReport } from "@/features/parent/report";

export const metadata: Metadata = { title: "Tiến độ của bé" };

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

const SAVED: Record<string, string> = {
  restored: "Đã khôi phục hồ sơ của bé.",
  updated: "Đã lưu hồ sơ của bé.",
  discover: "Bé đã hoàn thành hoạt động khám phá.",
};

async function Child({
  params,
  searchParams,
}: PageProps<"/parent/children/[childId]">) {
  const { childId } = await params;
  const { family } = await requireFamily(`/parent/children/${childId}`);
  // RLS: a child of another family is simply not found.
  const child = await getChild(childId);
  if (!child) notFound();
  const [report, catalog, guides, { saved }] = await Promise.all([
    getChildReport(child.id),
    getCatalog(),
    getSkillGuides(),
    searchParams,
  ]);
  const archived = child.status === "archived";
  const notice = typeof saved === "string" ? SAVED[saved] : undefined;

  return (
    <div className="flex flex-col gap-6">
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
          <div className="flex flex-wrap gap-2">
            <StartLearningButton childId={child.id} nickname={child.nickname} />
            <LittleLinkButton
              href={`/parent/children/${child.id}/edit`}
              variant="secondary"
              iconStart={<Pencil />}
            >
              Sửa hồ sơ
            </LittleLinkButton>
          </div>
        )}
      </LittleCard>

      {notice && (
        <p
          role="status"
          className="rounded-md bg-success-50 p-3 text-body font-semibold text-success-strong"
        >
          {notice}
        </p>
      )}

      {archived && (
        <LittleCard className="flex flex-col gap-3">
          <h2 className="text-h3">Hồ sơ đã được lưu trữ</h2>
          <p className="text-body text-ink-muted">
            Bé không còn trong danh sách chọn bé. Kết quả học tập vẫn được giữ
            lại bên dưới.
          </p>
          <ArchivedChildActions
            childId={child.id}
            nickname={child.nickname}
            canDelete={family.role === "owner"}
          />
        </LittleCard>
      )}

      <ChildDashboard
        childId={child.id}
        report={report}
        catalog={catalog}
        guides={guides}
        now={new Date()}
      />
    </div>
  );
}
