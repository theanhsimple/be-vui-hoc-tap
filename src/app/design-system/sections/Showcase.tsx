import { LittleBadge } from "@/components/ui/LittleBadge";
import { LittleContainer } from "@/components/ui/LittleContainer";
import { Logo } from "@/components/layout/Logo";

import { Controls } from "./Controls";
import { DashboardsDemo } from "./DashboardsDemo";
import { Foundations } from "./Foundations";
import { LearningDemo } from "./LearningDemo";
import { MotionDemo } from "./MotionDemo";
import { NavigationDemo } from "./NavigationDemo";
import { ResponsiveDemo } from "./ResponsiveDemo";
import { WorldsDemo } from "./WorldsDemo";

const TOC = [
  ["colors", "Màu sắc"],
  ["typography", "Chữ"],
  ["spacing", "Khoảng cách"],
  ["buttons", "Nút"],
  ["cards", "Thẻ"],
  ["forms", "Biểu mẫu"],
  ["badges", "Huy hiệu & tiến độ"],
  ["overlays", "Lớp phủ"],
  ["navigation", "Điều hướng"],
  ["learning", "Học tập"],
  ["parent", "Phụ huynh"],
  ["admin", "Quản trị"],
  ["illustration", "Minh hoạ"],
  ["motion", "Chuyển động"],
  ["responsive", "Responsive"],
] as const;

export function Showcase() {
  return (
    <LittleContainer
      width="wide"
      className="flex flex-col gap-10 py-8 tablet:py-12"
    >
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <Logo className="text-display" />
          <div>
            <h1 className="text-h1">Design system</h1>
            <p className="text-body text-ink-muted">
              Premium 3D Playful Learning · Sprint 02 · nội bộ cho sản phẩm & kỹ
              thuật
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LittleBadge tone="warning">
            Minh hoạ và mascot là hình tạm
          </LittleBadge>
          <LittleBadge tone="warning">
            Âm thanh là giọng đọc trình duyệt (demo)
          </LittleBadge>
          <LittleBadge tone="neutral">Dữ liệu là mẫu</LittleBadge>
        </div>
        <nav aria-label="Mục lục" className="flex flex-wrap gap-2">
          {TOC.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex min-h-10 items-center rounded-pill bg-surface px-4 text-body-sm font-bold text-ink shadow-xs hover:bg-blue-50"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>
      <Foundations />
      <Controls />
      <NavigationDemo />
      <LearningDemo />
      <DashboardsDemo />
      <WorldsDemo />
      <MotionDemo />
      <ResponsiveDemo />
    </LittleContainer>
  );
}
