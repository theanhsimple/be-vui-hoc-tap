import {
  BookOpen,
  FileQuestion,
  House,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Puzzle,
  Users,
} from "lucide-react";

import { SidebarNavigation, type SidebarSection } from "./SidebarNavigation";
import type { NavProps } from "./types";

/** CMS sections from PRD §5C. Routes are created in the admin sprint. */
export const ADMIN_SECTIONS: readonly SidebarSection[] = [
  {
    items: [
      { id: "dashboard", label: "Tổng quan", href: "/admin", icon: <House /> },
    ],
  },
  {
    title: "Nội dung",
    items: [
      {
        id: "modules",
        label: "Thế giới & module",
        href: "/admin/modules",
        icon: <Layers />,
      },
      {
        id: "skills",
        label: "Kỹ năng",
        href: "/admin/skills",
        icon: <Puzzle />,
      },
      {
        id: "questions",
        label: "Ngân hàng câu hỏi",
        href: "/admin/questions",
        icon: <FileQuestion />,
      },
      {
        id: "lessons",
        label: "Bài học",
        href: "/admin/lessons",
        icon: <BookOpen />,
      },
      {
        id: "assessments",
        label: "Đánh giá",
        href: "/admin/assessments",
        icon: <ListChecks />,
      },
      {
        id: "media",
        label: "Thư viện media",
        href: "/admin/media",
        icon: <ImageIcon />,
      },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      {
        id: "staff",
        label: "Nhân sự & quyền",
        href: "/admin/staff",
        icon: <Users />,
      },
    ],
  },
];

export function AdminNavigation({
  currentId,
  onNavigate,
}: Omit<NavProps, "items">) {
  return (
    <SidebarNavigation
      label="Quản trị nội dung"
      sections={ADMIN_SECTIONS}
      currentId={currentId}
      onNavigate={onNavigate}
    />
  );
}
