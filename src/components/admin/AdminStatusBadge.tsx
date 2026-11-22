import { Archive, CircleCheck, Clock, Pencil } from "lucide-react";

import { type BadgeTone, LittleBadge } from "../ui/LittleBadge";

/** content_status from DATABASE_SCHEMA.md. */
export type ContentStatus = "draft" | "in_review" | "published" | "archived";

export const CONTENT_STATUSES: readonly ContentStatus[] = [
  "draft",
  "in_review",
  "published",
  "archived",
];

const META: Record<
  ContentStatus,
  { label: string; tone: BadgeTone; Icon: typeof Pencil }
> = {
  draft: { label: "Bản nháp", tone: "neutral", Icon: Pencil },
  in_review: { label: "Đang duyệt", tone: "warning", Icon: Clock },
  published: { label: "Đã xuất bản", tone: "success", Icon: CircleCheck },
  archived: { label: "Lưu trữ", tone: "creative", Icon: Archive },
};

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: META.draft.label,
  in_review: META.in_review.label,
  published: META.published.label,
  archived: META.archived.label,
};

export function AdminStatusBadge({ status }: { status: ContentStatus }) {
  const { label, tone, Icon } = META[status];
  return (
    <LittleBadge tone={tone} size="sm" icon={<Icon />}>
      {label}
    </LittleBadge>
  );
}
