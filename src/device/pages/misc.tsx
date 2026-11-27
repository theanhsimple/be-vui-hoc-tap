"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Logo } from "@/components/layout/Logo";
import { LittleMascot } from "@/components/learning/LittleMascot";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";
import { StudentLoading } from "@/components/student/StudentLoading";

/** Client-side redirect (static hosting has no server redirects). */
export function Redirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => router.replace(to), [router, to]);
  return <StudentLoading />;
}

export function DeviceLanding() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <LittleCard
        padding="lg"
        className="flex max-w-xl flex-col items-center gap-4 text-center"
      >
        <LittleMascot size={128} />
        <Logo className="text-display" />
        <p className="text-h3">A little step. A big discovery.</p>
        <p className="text-body text-ink-muted">
          Học mà chơi cho bé 5–6 tuổi. Kết quả học được lưu ngay trên thiết bị
          này. Nội dung học là bản thử nghiệm, đang chờ chuyên gia giáo dục
          duyệt.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <LittleLinkButton href="/student/welcome" size="lg">
            Bé vào học
          </LittleLinkButton>
          <LittleLinkButton href="/parent" size="lg" variant="secondary">
            Dành cho bố mẹ
          </LittleLinkButton>
        </div>
      </LittleCard>
    </main>
  );
}

export function DevicePrivacy() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <Logo className="text-h1" />
      <LittleCard padding="lg" className="flex flex-col gap-4">
        <h1 className="text-display">Dữ liệu của bé được lưu ở đâu</h1>
        <ul className="list-disc pl-5 text-body">
          <li>
            Phiên bản này không có tài khoản và không có máy chủ lưu dữ liệu. Hồ
            sơ của bé (tên gọi, hình đại diện, năm sinh nếu có) và kết quả học
            chỉ nằm trong trình duyệt của thiết bị này.
          </li>
          <li>
            Không gửi dữ liệu đi đâu, không quảng cáo, không bảng xếp hạng,
            không thu thập ảnh hay email của bé.
          </li>
          <li>
            Bố mẹ có thể tải tệp sao lưu, khôi phục, hoặc xoá toàn bộ dữ liệu
            trong Cài đặt của khu vực bố mẹ.
          </li>
          <li>
            Phông chữ được tải từ chính trang này; trang được phục vụ bởi GitHub
            Pages (GitHub có thể ghi nhật ký truy cập như mọi trang web).
          </li>
        </ul>
      </LittleCard>
      <div>
        <LittleLinkButton href="/" variant="ghost">
          Về trang chủ
        </LittleLinkButton>
      </div>
    </main>
  );
}
