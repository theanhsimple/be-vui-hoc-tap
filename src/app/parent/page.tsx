import { Pencil, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { StartLearningButton } from "@/components/parent/ChildActions";
import { ChildProfileCard } from "@/components/parent/ChildProfileCard";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import {
  ageLabel,
  listChildren,
  requireFamily,
} from "@/features/family/queries";
import { ParentFrame } from "@/components/parent/ParentFrame";

export const metadata: Metadata = { title: "Gia đình" };

const SAVED: Record<string, string> = {
  child: "Đã lưu hồ sơ của bé.",
  archived: "Đã lưu trữ hồ sơ. Kết quả học tập vẫn được giữ lại.",
  password: "Đã đổi mật khẩu.",
};

export default function ParentHomePage(props: PageProps<"/parent">) {
  return (
    <ParentFrame currentId="family">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <Family {...props} />
      </Suspense>
    </ParentFrame>
  );
}

async function Family({ searchParams }: PageProps<"/parent">) {
  const { family } = await requireFamily("/parent");
  const [{ saved }, children] = await Promise.all([
    searchParams,
    listChildren({ includeArchived: true }),
  ]);
  const active = children.filter((c) => c.status === "active");
  const archived = children.filter((c) => c.status === "archived");
  const notice = typeof saved === "string" ? SAVED[saved] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-body-sm font-bold text-ink-muted">Gia đình</p>
          <h1 className="text-display">{family.displayName}</h1>
        </div>
        <LittleLinkButton href="/parent/children/new" iconStart={<UserPlus />}>
          Thêm hồ sơ bé
        </LittleLinkButton>
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-md bg-success-50 p-3 text-body font-semibold text-success-strong"
        >
          {notice}
        </p>
      )}

      {active.length === 0 ? (
        <LittleStatePanel
          kind="empty"
          title="Chưa có hồ sơ của bé"
          description="Tạo hồ sơ đầu tiên để bé bắt đầu khám phá."
          action={
            <LittleLinkButton href="/parent/children/new" size="lg">
              Tạo hồ sơ cho bé
            </LittleLinkButton>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
          {active.map((c) => (
            <li key={c.id}>
              <ChildProfileCard
                nickname={c.nickname}
                avatar={c.avatar}
                ageLabel={ageLabel(c.birthYear) || "Chưa có năm sinh"}
                actions={
                  <>
                    <StartLearningButton childId={c.id} nickname={c.nickname} />
                    <LittleLinkButton
                      href={`/parent/children/${c.id}`}
                      variant="secondary"
                      iconStart={<Pencil />}
                      aria-label={`Xem và sửa hồ sơ của ${c.nickname}`}
                    >
                      Hồ sơ
                    </LittleLinkButton>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <details className="rounded-md bg-surface p-4">
          <summary className="min-h-11 cursor-pointer text-body font-bold">
            Hồ sơ đã lưu trữ ({archived.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1 text-body text-ink-muted">
            {archived.map((c) => (
              <li key={c.id}>{c.nickname}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
