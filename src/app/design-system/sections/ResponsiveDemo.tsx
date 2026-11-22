import { LittleBadge } from "@/components/ui/LittleBadge";
import { LittleCard } from "@/components/ui/LittleCard";
import { BREAKPOINTS, TOUCH_TARGET } from "@/design-system/tokens";

import { Section } from "./Section";

export function ResponsiveDemo() {
  return (
    <Section
      id="responsive"
      title="Responsive"
      intro={`Mobile < ${BREAKPOINTS.tablet}px ≤ tablet < ${BREAKPOINTS.desktop}px ≤ desktop. iPad landscape (1180×820) is the reference; portrait (820×1180) must stay fully usable.`}
    >
      <LittleCard surface="blue" className="flex flex-wrap items-center gap-3">
        <span className="text-body font-bold">Breakpoint hiện tại:</span>
        <LittleBadge tone="info" className="tablet:hidden">
          mobile
        </LittleBadge>
        <LittleBadge
          tone="info"
          className="hidden tablet:inline-flex desktop:hidden"
        >
          tablet
        </LittleBadge>
        <LittleBadge tone="info" className="hidden desktop:inline-flex">
          desktop
        </LittleBadge>
        <span className="text-body-sm text-ink-muted">
          Thay đổi kích thước cửa sổ hoặc xoay iPad để xem các thành phần khác
          thích ứng.
        </span>
      </LittleCard>
      <ul className="grid gap-3 text-body tablet:grid-cols-2">
        <li>
          • Child primary actions ≥ {TOUCH_TARGET.child} px; answer tiles scale
          96–216 px with viewport width.
        </li>
        <li>
          • Parent/admin controls ≥ 40–48 px; touch target never below{" "}
          {TOUCH_TARGET.min} px for key actions.
        </li>
        <li>
          • No hover-only interactions: hover styles apply only on pointer
          devices.
        </li>
        <li>
          • Safe-area insets respected by shells, bottom navigation and toasts.
        </li>
        <li>
          • Content max-width 1120 px (parent) / 1200 px (student) so desktop
          doesn’t stretch.
        </li>
        <li>
          • Admin tables hide secondary columns below 1024 px and scroll
          horizontally if needed.
        </li>
      </ul>
    </Section>
  );
}
