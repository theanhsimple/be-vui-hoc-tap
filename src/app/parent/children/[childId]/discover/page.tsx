import { Clock, HeartHandshake, MessageCircle, Volume2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { PlacementStart } from "@/components/parent/PlacementStart";
import { ParentFrame } from "@/components/parent/ParentFrame";
import { LittleAvatar } from "@/components/ui/LittleAvatar";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { getChild, requireFamily } from "@/features/family/queries";
import { getPlacement } from "@/features/learning/backend/content";
import { getActivePlacement } from "@/features/learning/backend/student";
import { getAssessmentSummary } from "@/features/parent/report";

export const metadata: Metadata = { title: "Hoạt động khám phá" };

const ACTIVITY = "first-discovery";

export default function DiscoverIntroPage(
  props: PageProps<"/parent/children/[childId]/discover">,
) {
  return (
    <ParentFrame currentId="family">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <Intro {...props} />
      </Suspense>
    </ParentFrame>
  );
}

const TIPS = [
  {
    icon: <HeartHandshake />,
    text: "Ngồi cạnh bé. Bé tự chọn câu trả lời; bố mẹ không cần nhắc đáp án.",
  },
  {
    icon: <Volume2 />,
    text: "Bật âm thanh để bé nghe câu hỏi. Bé có thể bấm nghe lại.",
  },
  {
    icon: <MessageCircle />,
    text: "Bé chỉ nghe lời động viên, không thấy đúng hay sai. Mỗi câu chỉ chọn một lần.",
  },
  {
    icon: <Clock />,
    text: "Nếu bé mệt, cứ dừng lại. Lần sau bé chơi tiếp từ câu đang dở.",
  },
];

async function Intro({
  params,
  searchParams,
}: PageProps<"/parent/children/[childId]/discover">) {
  const { childId } = await params;
  await requireFamily(`/parent/children/${childId}/discover`);
  const child = await getChild(childId);
  if (!child) notFound();
  if (child.status !== "active") redirect(`/parent/children/${child.id}`);
  const [activity, open, last, { welcome }] = await Promise.all([
    getPlacement(ACTIVITY),
    getActivePlacement(child.id, ACTIVITY),
    getAssessmentSummary(child.id),
    searchParams,
  ]);
  if (!activity) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      {welcome === "1" && (
        <p
          role="status"
          className="rounded-md bg-success-50 p-3 text-body font-semibold text-success-strong"
        >
          Đã tạo hồ sơ của {child.nickname}. Bước tiếp theo (không bắt buộc):
          cùng bé làm hoạt động khám phá.
        </p>
      )}
      <LittleCard padding="lg" className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <LittleAvatar
            name={child.nickname}
            avatar={child.avatar}
            size="lg"
            decorative
          />
          <div className="min-w-0">
            <p className="text-body-sm font-bold text-ink-muted">
              Hoạt động khám phá · {activity.questions.length} câu
            </p>
            <h1 className="text-h1">
              {activity.title} cùng {child.nickname}
            </h1>
          </div>
        </div>
        <p className="text-body-lg">{activity.intro}</p>
        <ul className="flex flex-col gap-3">
          {TIPS.map((t) => (
            <li key={t.text} className="flex items-start gap-3 text-body">
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-strong [&_svg]:size-5"
              >
                {t.icon}
              </span>
              <span className="pt-2">{t.text}</span>
            </li>
          ))}
        </ul>
        <p className="rounded-md bg-surface-muted p-3 text-body-sm text-ink-muted">
          Kết quả là những quan sát ban đầu để gợi ý nơi bé nên bắt đầu. Hoạt
          động không cho điểm, không xếp loại và không liên quan đến yêu cầu
          tuyển sinh của trường nào.
        </p>
        <PlacementStart
          childId={child.id}
          nickname={child.nickname}
          activityId={activity.id}
          openAt={open ? open.currentIndex : null}
          total={activity.questions.length}
          done={Boolean(last)}
        />
      </LittleCard>
      <div>
        <LittleLinkButton href={`/parent/children/${child.id}`} variant="ghost">
          Để sau
        </LittleLinkButton>
      </div>
    </div>
  );
}
