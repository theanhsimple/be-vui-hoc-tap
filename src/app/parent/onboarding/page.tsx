import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { FamilyForm, JoinFamilyForm } from "@/components/parent/FamilyForm";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { requireUser } from "@/features/auth/session";
import { getMyFamily } from "@/features/family/queries";
import { ParentFrame } from "@/components/parent/ParentFrame";

export const metadata: Metadata = { title: "Tạo gia đình" };

export default function OnboardingPage(props: PageProps<"/parent/onboarding">) {
  return (
    <ParentFrame>
      <LittleCard
        padding="lg"
        className="mx-auto flex w-full max-w-xl flex-col gap-4"
      >
        <div>
          <p className="text-body-sm font-bold text-ink-muted">Bước 1/2</p>
          <h1 className="text-h1">Tạo không gian học của gia đình</h1>
          <p className="text-body text-ink-muted">
            Mỗi gia đình là một không gian riêng tư. Chỉ thành viên gia đình mới
            xem được hồ sơ và kết quả của bé.
          </p>
        </div>
        <Suspense fallback={<LittleStatePanel kind="loading" />}>
          <Onboarding {...props} />
        </Suspense>
      </LittleCard>
      <LittleCard
        padding="lg"
        className="mx-auto mt-5 flex w-full max-w-xl flex-col gap-4"
      >
        <div>
          <h2 className="text-h2">Tham gia bằng mã mời</h2>
          <p className="text-body text-ink-muted">
            Gia đình đã có tài khoản little? Nhờ chủ gia đình tạo mã mời trong
            Cài đặt, rồi nhập mã ở đây.
          </p>
        </div>
        <JoinFamilyForm />
      </LittleCard>
    </ParentFrame>
  );
}

async function Onboarding({ searchParams }: PageProps<"/parent/onboarding">) {
  await requireUser("/parent/onboarding");
  if (await getMyFamily()) redirect("/parent");
  const { deleted } = await searchParams;
  return (
    <>
      {deleted === "family" && (
        <p
          role="status"
          className="rounded-md bg-success-50 p-3 text-body font-semibold text-success-strong"
        >
          Đã xoá gia đình và toàn bộ dữ liệu của các bé.
        </p>
      )}
      <FamilyForm />
    </>
  );
}
