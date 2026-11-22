import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { LittleMascot } from "@/components/learning/LittleMascot";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleLinkButton } from "@/components/ui/LittleLinkButton";
import { getServerEnv } from "@/lib/env.server";

/** Minimal public entry until the marketing site exists. */
export default function HomePage() {
  const showDesignSystem =
    process.env.NODE_ENV !== "production" ||
    getServerEnv().ENABLE_DESIGN_SYSTEM;
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
          Học mà chơi cho bé 5–6 tuổi. Bản thử nghiệm: nội dung học là nội dung
          mẫu, đang chờ chuyên gia giáo dục duyệt.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <LittleLinkButton href="/student/welcome" size="lg">
            Bé vào học
          </LittleLinkButton>
          <LittleLinkButton href="/auth/login" size="lg" variant="secondary">
            Bố mẹ đăng nhập
          </LittleLinkButton>
        </div>
        {showDesignSystem && (
          <Link
            href="/design-system"
            className="mt-2 inline-flex min-h-11 items-center text-body font-bold text-blue-strong underline underline-offset-4"
          >
            Xem design system (nội bộ)
          </Link>
        )}
      </LittleCard>
    </main>
  );
}
