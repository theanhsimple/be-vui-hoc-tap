import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { LittleMascot } from "@/components/learning/LittleMascot";
import { LittleCard } from "@/components/ui/LittleCard";
import { getServerEnv } from "@/lib/env.server";

/**
 * Temporary holding page until the student welcome screen (/play) and
 * the parent area (/parent) are built.
 */
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
          little đang được xây dựng. Trải nghiệm học tập cho bé 5–6 tuổi sẽ sớm
          có mặt.
        </p>
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
