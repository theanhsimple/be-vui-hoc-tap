"use client";

import { ChartColumn, House, Settings, Users } from "lucide-react";
import { type MouseEvent, useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminShell } from "@/components/layout/AdminShell";
import { ParentShell } from "@/components/layout/ParentShell";
import { StudentShell } from "@/components/layout/StudentShell";
import { LearningProgress } from "@/components/learning/LearningProgress";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { StudentNavigation } from "@/components/navigation/StudentNavigation";
import type { NavItem } from "@/components/navigation/types";
import { LittleAvatar } from "@/components/ui/LittleAvatar";
import { LittleButton } from "@/components/ui/LittleButton";
import { useToast } from "@/components/ui/LittleToast";

import { Demo, Section } from "./Section";

const PARENT_NAV: NavItem[] = [
  { id: "home", label: "Tổng quan", href: "/parent", icon: <House /> },
  {
    id: "progress",
    label: "Tiến độ",
    href: "/parent/progress",
    icon: <ChartColumn />,
  },
  {
    id: "children",
    label: "Hồ sơ bé",
    href: "/parent/children",
    icon: <Users />,
  },
  {
    id: "settings",
    label: "Cài đặt",
    href: "/parent/settings",
    icon: <Settings />,
  },
];

/** Previews intercept navigation (the real routes arrive in later sprints). */
function usePreviewNav(initial: string) {
  const [current, setCurrent] = useState(initial);
  const onNavigate = (id: string, e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setCurrent(id);
  };
  return { current, onNavigate };
}

export function NavigationDemo() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const parent = usePreviewNav("home");
  const admin = usePreviewNav("questions");

  return (
    <Section
      id="navigation"
      title="Điều hướng & khung màn hình"
      intro="Each experience has its own navigation: students get one back button and a gated parent lock; parents a header (tablet+) or bottom tabs (mobile); admins a sidebar. Previews below intercept clicks instead of navigating."
    >
      <Demo
        title="StudentShell + StudentNavigation"
        note="Lock opens the parent gate (written number, hold 1.5 s). Back steps the demo progress."
      >
        <div className="h-[420px] overflow-hidden rounded-xl ring-4 ring-ink">
          <StudentShell
            fill="container"
            navigation={
              <StudentNavigation
                onBack={() => setStep((s) => Math.max(0, s - 1))}
                center={<LearningProgress total={5} current={step} />}
                onParentAccess={() =>
                  toast({
                    tone: "success",
                    title: "Đã qua cổng phụ huynh",
                    description: "Trang phụ huynh sẽ mở ở đây.",
                  })
                }
              />
            }
          >
            <div className="flex flex-col items-center gap-4">
              <p className="text-h2">Khu vực hoạt động của bé</p>
              <LittleButton
                size="xl"
                onClick={() => setStep((s) => Math.min(5, s + 1))}
              >
                Câu tiếp theo
              </LittleButton>
            </div>
          </StudentShell>
        </div>
      </Demo>

      <Demo
        title="ParentShell"
        note="Resize below 640 px: the header links become a bottom tab bar."
      >
        <div className="overflow-hidden rounded-xl ring-1 ring-border">
          <ParentShell
            items={PARENT_NAV}
            currentId={parent.current}
            onNavigate={parent.onNavigate}
            bottomNavPosition="static"
            actions={<LittleAvatar name="Nguyễn Minh Anh" size="sm" />}
          >
            <p className="text-h2">
              {PARENT_NAV.find((n) => n.id === parent.current)?.label}
            </p>
            <p className="mt-1 text-body text-ink-muted">
              Nội dung trang phụ huynh.
            </p>
          </ParentShell>
        </div>
      </Demo>

      <Demo
        title="AdminShell + AdminNavigation + Breadcrumb"
        note="Sidebar from 1024 px; stacked above content on iPad."
      >
        <div className="overflow-hidden rounded-xl ring-1 ring-border">
          <AdminShell currentId={admin.current} onNavigate={admin.onNavigate}>
            <AdminPageHeader
              title="Ngân hàng câu hỏi"
              description="Quản lý câu hỏi theo kỹ năng. Đáp án được lưu riêng, không gửi tới thiết bị của bé."
              breadcrumb={[
                { label: "Quản trị", href: "#navigation" },
                { label: "Nội dung", href: "#navigation" },
                { label: "Ngân hàng câu hỏi" },
              ]}
            />
            <p className="mt-4 text-body-sm text-ink-muted">
              Mục đang chọn: {admin.current}
            </p>
          </AdminShell>
        </div>
      </Demo>

      <Demo title="Breadcrumb (standalone)">
        <Breadcrumb
          items={[
            { label: "Tổng quan", href: "#navigation" },
            { label: "Hồ sơ bé", href: "#navigation" },
            { label: "Bông" },
          ]}
        />
      </Demo>
    </Section>
  );
}
