import { BookOpen, CalendarDays, Clock, Compass, Star } from "lucide-react";

import { LEARNING_WORLDS } from "@/design-system/worlds";
import type { SkillGuide } from "@/features/learning/backend/content";
import type { Catalog } from "@/features/learning/types";
import {
  BAND_OF,
  type ChildReport,
  formatDate,
  formatDuration,
  formatWhen,
  OBSERVATION_OF,
  suggestedStart,
  weekTotals,
} from "@/features/parent/report-model";

import { LittleCard } from "../ui/LittleCard";
import { LittleLinkButton } from "../ui/LittleLinkButton";
import { LittleProgress } from "../ui/LittleProgress";
import { LittleStatePanel } from "../ui/LittleStatePanel";
import { AssessmentSummaryCard } from "./AssessmentSummaryCard";
import { LearningActivityCard } from "./LearningActivityCard";
import { ParentStatCard } from "./ParentStatCard";
import { SkillProgressCard } from "./SkillProgressCard";

export interface ChildDashboardProps {
  childId: string;
  report: ChildReport;
  catalog: Catalog;
  guides: Record<string, SkillGuide>;
  now: Date;
  /** Where the placement activity intro lives (differs per edition). */
  discoverHref?: string;
}

/**
 * Parent view of one child's learning (PRD P5/P6): time, sessions, worlds,
 * skill bands with at-home ideas, recent lessons, placement observations.
 * Plain language only — no scores, percentages or comparisons.
 */
export function ChildDashboard({
  childId,
  report,
  catalog,
  guides,
  now,
  discoverHref = `/parent/children/${childId}/discover`,
}: ChildDashboardProps) {
  const worldMeta = new Map(LEARNING_WORLDS.map((w) => [w.id, w]));
  const lessons = new Map(
    catalog.worlds.flatMap((w) =>
      w.skills.flatMap((s) => s.lessons.map((l) => [l.id, l] as const)),
    ),
  );
  const skills = new Map(
    catalog.worlds.flatMap((w) => w.skills.map((s) => [s.id, s] as const)),
  );
  const week = weekTotals(report);
  const started = report.skills.filter((s) => s.state !== "not_started");
  const notStarted = report.skills.filter((s) => s.state === "not_started");
  const worldName = (id: string) => worldMeta.get(id)?.nameVi ?? id;
  const assessment = report.assessment;
  const suggestion = assessment
    ? suggestedStart(
        assessment,
        catalog.worlds.filter((w) => !w.unlock).map((w) => w.id),
      )
    : undefined;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="overview" className="flex flex-col gap-3">
        <h2 id="overview" className="text-h2">
          Tổng quan
        </h2>
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
          <ParentStatCard
            label="Thời gian học"
            value={formatDuration(week.seconds)}
            hint="7 ngày qua · ước tính"
            icon={<Clock />}
            tone="blue"
          />
          <ParentStatCard
            label="Ngày có học"
            value={`${report.totals.activeDays7} ngày`}
            hint="7 ngày qua"
            icon={<CalendarDays />}
            tone="mint"
          />
          <ParentStatCard
            label="Bài đã hoàn thành"
            value={String(report.totals.lessonsCompleted)}
            hint={`Tổng cộng · ${formatDuration(report.totals.activeSeconds)}`}
            icon={<BookOpen />}
            tone="lavender"
          />
          <ParentStatCard
            label="Ngôi sao"
            value={String(report.totals.stars)}
            hint={`${report.totals.badges} huy hiệu`}
            icon={<Star />}
            tone="yellow"
          />
        </div>
      </section>

      {assessment ? (
        <section aria-labelledby="placement" className="flex flex-col gap-3">
          <h2 id="placement" className="text-h2">
            Hoạt động khám phá
          </h2>
          <AssessmentSummaryCard
            title={assessment.title}
            date={formatDate(assessment.completedAt)}
            observations={assessment.modules.map((m) => ({
              domain: worldName(m.moduleId),
              band: m.band,
            }))}
            action={
              <div className="flex flex-col gap-3">
                {suggestion && (
                  <p className="flex items-start gap-2 text-body">
                    <Compass
                      aria-hidden
                      className="mt-0.5 size-5 shrink-0 text-blue-strong"
                    />
                    <span>
                      Gợi ý bắt đầu với{" "}
                      <span className="font-bold">{worldName(suggestion)}</span>
                      .
                    </span>
                  </p>
                )}
                <div>
                  <LittleLinkButton href={discoverHref} variant="secondary">
                    Làm lại cùng bé
                  </LittleLinkButton>
                </div>
              </div>
            }
          />
        </section>
      ) : (
        report.child.status === "active" && (
          <LittleCard
            surface="blue"
            elevation="none"
            className="flex flex-wrap items-center gap-4"
          >
            <Compass aria-hidden className="size-8 shrink-0 text-blue-strong" />
            <div className="min-w-0 flex-1">
              <h2 className="text-h3">Cùng bé làm hoạt động khám phá</h2>
              <p className="text-body text-ink-muted">
                Khoảng 5 phút chơi cùng bố mẹ để gợi ý nơi bé nên bắt đầu. Không
                có điểm số.
              </p>
            </div>
            <LittleLinkButton href={discoverHref}>
              Xem hướng dẫn
            </LittleLinkButton>
          </LittleCard>
        )
      )}

      <section aria-labelledby="worlds" className="flex flex-col gap-3">
        <h2 id="worlds" className="text-h2">
          Các thế giới
        </h2>
        <LittleCard className="grid grid-cols-1 gap-x-8 gap-y-4 desktop:grid-cols-2">
          {report.modules.map((m) => (
            <LittleProgress
              key={m.moduleId}
              label={worldName(m.moduleId)}
              value={m.completed}
              max={Math.max(m.total, 1)}
              valueText={`${m.completed}/${m.total} bài`}
              tone={
                (worldMeta.get(m.moduleId)?.tone ?? "blue") as
                  "blue" | "mint" | "yellow" | "lavender" | "coral"
              }
            />
          ))}
        </LittleCard>
      </section>

      <section aria-labelledby="skills" className="flex flex-col gap-3">
        <div>
          <h2 id="skills" className="text-h2">
            Kỹ năng
          </h2>
          <p className="text-body text-ink-muted">
            Dựa trên lần trả lời đầu tiên của bé ở mỗi câu, qua nhiều buổi học.
            Đây là quan sát để bố mẹ đồng hành, không phải điểm số.
          </p>
        </div>
        {started.length === 0 ? (
          <LittleStatePanel
            kind="empty"
            title="Chưa có kỹ năng nào được luyện"
            description="Khi bé học xong bài đầu tiên, quan sát về kỹ năng sẽ hiện ở đây."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
            {started.map((s) => {
              const skill = skills.get(s.skillId);
              return (
                <li key={s.skillId}>
                  <SkillProgressCard
                    domain={skill ? worldName(skill.worldId) : ""}
                    skill={skill?.title ?? s.skillId}
                    band={BAND_OF[s.state]}
                    observation={OBSERVATION_OF[s.state]}
                    homeActivity={guides[s.skillId]?.homeActivity || undefined}
                  />
                </li>
              );
            })}
          </ul>
        )}
        {notStarted.length > 0 && (
          <details className="rounded-md bg-surface p-4">
            <summary className="min-h-11 cursor-pointer content-center text-body font-bold">
              Kỹ năng bé chưa học ({notStarted.length})
            </summary>
            <ul className="mt-2 flex flex-col gap-2">
              {notStarted.map((s) => {
                const skill = skills.get(s.skillId);
                return (
                  <li key={s.skillId} className="text-body">
                    <span className="font-bold">
                      {skill?.title ?? s.skillId}
                    </span>
                    {skill && (
                      <span className="text-ink-muted">
                        {" "}
                        · {worldName(skill.worldId)}
                      </span>
                    )}
                    {guides[s.skillId]?.summary && (
                      <span className="block text-body-sm text-ink-muted">
                        {guides[s.skillId]!.summary}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </section>

      <section aria-labelledby="recent" className="flex flex-col gap-3">
        <h2 id="recent" className="text-h2">
          Hoạt động gần đây
        </h2>
        {report.recent.length === 0 ? (
          <LittleStatePanel
            kind="empty"
            title="Bé chưa hoàn thành bài học nào"
            description="Các bài bé học xong sẽ hiện ở đây, mới nhất ở trên cùng."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {report.recent.slice(0, 10).map((r) => {
              const lesson = lessons.get(r.lessonId);
              const world =
                (lesson && worldMeta.get(lesson.worldId)) ??
                LEARNING_WORLDS[0]!;
              return (
                <li key={r.sessionId}>
                  <LearningActivityCard
                    title={lesson?.title ?? r.lessonId}
                    world={world}
                    when={formatWhen(r.completedAt, now)}
                    duration={formatDuration(r.activeSeconds)}
                    stars={r.stars}
                    status="completed"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
