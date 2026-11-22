"use client";

import { CalendarDays, Clock, Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";

import {
  type AdminColumn,
  AdminDataTable,
} from "@/components/admin/AdminDataTable";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminStatusBadge,
  CONTENT_STATUSES,
  type ContentStatus,
  STATUS_LABEL,
} from "@/components/admin/AdminStatusBadge";
import { AssessmentSummaryCard } from "@/components/parent/AssessmentSummaryCard";
import { ChildProfileCard } from "@/components/parent/ChildProfileCard";
import { LearningActivityCard } from "@/components/parent/LearningActivityCard";
import { ParentStatCard } from "@/components/parent/ParentStatCard";
import { SkillProgressCard } from "@/components/parent/SkillProgressCard";
import { LittleBadge } from "@/components/ui/LittleBadge";
import { LittleButton } from "@/components/ui/LittleButton";
import { useToast } from "@/components/ui/LittleToast";
import { LEARNING_WORLDS } from "@/design-system/worlds";

import { Section } from "./Section";

const SAMPLE = (
  <LittleBadge tone="neutral">
    Dữ liệu mẫu — không phải dữ liệu thật
  </LittleBadge>
);

export function DashboardsDemo() {
  return (
    <>
      <ParentComponents />
      <AdminComponents />
    </>
  );
}

function ParentComponents() {
  const toast = useToast();
  const soon = (what: string) => () =>
    toast({
      tone: "info",
      title: `${what} sẽ có trong sprint Parent Dashboard.`,
    });
  const [numberKingdom, alphabetForest] = [
    LEARNING_WORLDS[1]!,
    LEARNING_WORLDS[0]!,
  ];
  return (
    <Section
      id="parent"
      title="Thành phần cho phụ huynh"
      intro="Observations in plain language — no scores, rankings or comparisons with other children. Mastery is shown as a band with its label, never a percentage."
    >
      {SAMPLE}
      <div className="grid gap-4 tablet:grid-cols-3">
        <ParentStatCard
          label="Thời gian học"
          value="42 phút"
          hint="7 ngày qua"
          icon={<Clock />}
          tone="blue"
        />
        <ParentStatCard
          label="Số buổi học"
          value="6 buổi"
          hint="7 ngày qua"
          icon={<CalendarDays />}
          tone="mint"
        />
        <ParentStatCard
          label="Ngôi sao"
          value="14"
          hint="Tổng cộng"
          icon={<Star />}
          tone="yellow"
        />
      </div>
      <ChildProfileCard
        nickname="Bông"
        avatar="flower"
        ageLabel="5 tuổi"
        lastActive="Học lần cuối: hôm qua"
        actions={
          <>
            <LittleButton
              size="sm"
              variant="secondary"
              onClick={soon("Trang tiến độ")}
            >
              Xem tiến độ
            </LittleButton>
            <LittleButton size="sm" onClick={soon("Chế độ học của bé")}>
              Cho bé học
            </LittleButton>
          </>
        }
      />
      <div className="grid gap-4 desktop:grid-cols-2">
        <SkillProgressCard
          domain="Số và đếm"
          skill="Đếm đến 10"
          band="confident"
          observation="Bé đếm chắc chắn các nhóm đồ vật đến 10."
          homeActivity="Khi dọn đồ chơi, cùng bé đếm số món cho vào hộp."
        />
        <SkillProgressCard
          domain="Hình dạng"
          skill="Nhận biết hình cơ bản"
          band="developing"
          observation="Bé nhận ra hình tròn và hình vuông; đang làm quen với hình tam giác."
        />
        <SkillProgressCard
          domain="Quy luật"
          skill="Hoàn thành dãy lặp"
          band="exploring"
        />
        <SkillProgressCard
          domain="Trí nhớ"
          skill="Ghép cặp hình"
          band="not_started"
        />
      </div>
      <div className="grid gap-4 desktop:grid-cols-2">
        <div className="flex flex-col gap-3">
          <LearningActivityCard
            title="Đếm táo trong vườn"
            world={numberKingdom}
            when="Hôm nay, 17:20"
            duration="8 phút"
            stars={3}
            status="completed"
          />
          <LearningActivityCard
            title="Tìm chữ cái A"
            world={alphabetForest}
            when="Hôm qua, 19:05"
            duration="5 phút"
            status="in_progress"
          />
        </div>
        <AssessmentSummaryCard
          title="Hoạt động làm quen"
          date="Ngày 12/11/2026"
          observations={[
            {
              domain: "Số và đếm",
              band: "developing",
              note: "Đếm tốt đến 5, đang luyện đến 10.",
            },
            { domain: "Hình dạng", band: "exploring" },
            { domain: "Quy luật", band: "exploring" },
          ]}
          action={
            <LittleButton
              variant="secondary"
              onClick={soon("Chi tiết hoạt động làm quen")}
            >
              Xem chi tiết
            </LittleButton>
          }
        />
      </div>
    </Section>
  );
}

interface QuestionRow {
  id: string;
  prompt: string;
  skill: string;
  type: string;
  status: ContentStatus;
  updated: string;
}

const ROWS: QuestionRow[] = [
  {
    id: "q1",
    prompt: "Quả bóng có hình gì?",
    skill: "Nhận biết hình",
    type: "Chọn hình",
    status: "published",
    updated: "20/11/2026",
  },
  {
    id: "q2",
    prompt: "Có bao nhiêu quả táo?",
    skill: "Đếm đến 10",
    type: "Đếm và chạm",
    status: "in_review",
    updated: "21/11/2026",
  },
  {
    id: "q3",
    prompt: "Hình nào tiếp theo?",
    skill: "Hoàn thành dãy lặp",
    type: "Quy luật",
    status: "draft",
    updated: "22/11/2026",
  },
  {
    id: "q4",
    prompt: "Xếp từ nhỏ đến lớn",
    skill: "So sánh kích thước",
    type: "Sắp xếp",
    status: "draft",
    updated: "22/11/2026",
  },
  {
    id: "q5",
    prompt: "Tìm hai thẻ giống nhau",
    skill: "Ghép cặp hình",
    type: "Trí nhớ",
    status: "archived",
    updated: "02/10/2026",
  },
];

const COLUMNS: AdminColumn<QuestionRow>[] = [
  {
    key: "prompt",
    header: "Câu hỏi",
    cell: (r) => <span className="font-bold">{r.prompt}</span>,
  },
  { key: "skill", header: "Kỹ năng", cell: (r) => r.skill },
  { key: "type", header: "Dạng", cell: (r) => r.type, desktopOnly: true },
  {
    key: "status",
    header: "Trạng thái",
    cell: (r) => <AdminStatusBadge status={r.status} />,
  },
  {
    key: "updated",
    header: "Cập nhật",
    cell: (r) => <span className="text-ink-muted">{r.updated}</span>,
    align: "end",
    desktopOnly: true,
  },
];

function AdminComponents() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ContentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const rows = useMemo(
    () =>
      ROWS.filter(
        (r) =>
          (active.length === 0 || active.includes(r.status)) &&
          (query.trim() === "" ||
            `${r.prompt} ${r.skill}`
              .toLowerCase()
              .includes(query.trim().toLowerCase())),
      ),
    [query, active],
  );
  return (
    <Section
      id="admin"
      title="Thành phần quản trị"
      intro="Dense, desktop-first, still touch-friendly (≥ 40 px controls). The filter bar and table below are fully working on sample rows."
    >
      {SAMPLE}
      <AdminPageHeader
        title="Ngân hàng câu hỏi"
        description="Câu hỏi được nhóm theo kỹ năng. Đáp án lưu riêng trên máy chủ."
        breadcrumb={[
          { label: "Quản trị", href: "#admin" },
          { label: "Ngân hàng câu hỏi" },
        ]}
        actions={
          <>
            <LittleButton
              size="sm"
              variant="secondary"
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1200);
              }}
            >
              Xem trạng thái tải
            </LittleButton>
            <LittleButton
              size="sm"
              iconStart={<Plus />}
              onClick={() =>
                toast({
                  tone: "info",
                  title: "Trình tạo câu hỏi sẽ có trong sprint Admin CMS.",
                })
              }
            >
              Thêm câu hỏi
            </LittleButton>
          </>
        }
      />
      <AdminFilterBar
        query={query}
        onQueryChange={setQuery}
        searchLabel="Tìm câu hỏi"
        filters={CONTENT_STATUSES.map((s) => ({
          value: s,
          label: STATUS_LABEL[s],
        }))}
        active={active}
        onActiveChange={setActive}
        resultCount={rows.length}
      />
      <AdminDataTable
        caption="Danh sách câu hỏi"
        columns={COLUMNS}
        rows={rows}
        getRowId={(r) => r.id}
        loading={loading}
        emptyTitle="Không có câu hỏi phù hợp"
        emptyDescription="Thử bỏ bớt bộ lọc hoặc đổi từ khoá."
        emptyAction={
          <LittleButton
            size="sm"
            variant="secondary"
            onClick={() => {
              setQuery("");
              setActive([]);
            }}
          >
            Xoá bộ lọc
          </LittleButton>
        }
      />
    </Section>
  );
}
