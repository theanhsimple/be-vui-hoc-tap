import Link from "next/link";

import { Mascot } from "@/components/kid/Mascot";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/layout/Logo";
import { getServerEnv } from "@/lib/env.server";

/**
 * Temporary holding page. The child welcome screen arrives at /play in
 * Sprint 02 and the parent area at /parent in Sprint 04.
 */
export default function HomePage() {
  const showDesignSystem =
    process.env.NODE_ENV !== "production" ||
    getServerEnv().ENABLE_DESIGN_SYSTEM;

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <Card
        padding="lg"
        className="flex max-w-xl flex-col items-center gap-4 text-center"
      >
        <Mascot size={140} />
        <Logo className="text-[48px]" />
        <p className="text-[22px] font-bold">A little step. A big discovery.</p>
        <p className="text-[17px] text-ink-600">
          little đang được xây dựng. Trải nghiệm học tập cho bé 5–6 tuổi sẽ sớm
          có mặt.
        </p>
        {showDesignSystem && (
          <Link
            href="/dev/design-system"
            className="mt-2 text-[15px] font-bold text-sky-600 underline underline-offset-4"
          >
            Xem design system (dành cho nhóm phát triển)
          </Link>
        )}
      </Card>
    </main>
  );
}
