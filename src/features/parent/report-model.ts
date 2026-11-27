import { z } from "zod";

import type { MasteryBand } from "@/components/parent/mastery";

import { APP_TIME_ZONE, dateKeyIn } from "../learning/progress/calc";

/**
 * Parent report: validates the JSON of get_child_report /
 * get_assessment_summary and turns it into plain-language observations.
 * Pure (no I/O) so it is unit-tested. Never produces scores or rankings.
 */

const band = z.enum(["not_started", "exploring", "developing", "confident"]);

export const assessmentSummarySchema = z.object({
  runId: z.uuid(),
  assessmentId: z.string(),
  title: z.string(),
  startedAt: z.string(),
  completedAt: z.string(),
  items: z.number().int(),
  modules: z.array(
    z.object({
      moduleId: z.string(),
      items: z.number().int(),
      correct: z.number().int(),
      band,
    }),
  ),
});
export type AssessmentSummary = z.infer<typeof assessmentSummarySchema>;

export const masteryState = z.enum([
  "not_started",
  "learning",
  "practicing",
  "mastered",
  "review",
]);
export type MasteryState = z.infer<typeof masteryState>;

export const childReportSchema = z.object({
  child: z.object({
    id: z.uuid(),
    nickname: z.string(),
    status: z.enum(["active", "archived"]),
  }),
  totals: z.object({
    sessionsCompleted: z.number().int(),
    activeSeconds: z.number().int(),
    lessonsCompleted: z.number().int(),
    stars: z.number().int(),
    badges: z.number().int(),
    activeDays7: z.number().int(),
  }),
  last7: z.array(
    z.object({
      date: z.string(),
      sessions: z.number().int(),
      seconds: z.number().int(),
    }),
  ),
  modules: z.array(
    z.object({
      moduleId: z.string(),
      total: z.number().int(),
      completed: z.number().int(),
      stars: z.number().int(),
      lastAt: z.string().nullable(),
    }),
  ),
  skills: z.array(
    z.object({
      skillId: z.string(),
      state: masteryState,
      accuracy: z.number(),
      evidence: z.number().int(),
      sessions: z.number().int(),
      lastPracticedAt: z.string().nullable(),
    }),
  ),
  recent: z.array(
    z.object({
      sessionId: z.uuid(),
      lessonId: z.string(),
      completedAt: z.string(),
      activeSeconds: z.number().int(),
      correct: z.number().int(),
      firstTry: z.number().int(),
      total: z.number().int(),
      stars: z.number().int(),
    }),
  ),
  assessment: assessmentSummarySchema.nullable(),
});
export type ChildReport = z.infer<typeof childReportSchema>;

/** Engine state → the band parents see (DATABASE_SCHEMA.md §7). */
export const BAND_OF: Record<MasteryState, MasteryBand> = {
  not_started: "not_started",
  learning: "exploring",
  practicing: "developing",
  mastered: "confident",
  review: "developing",
};

/** One factual sentence per state; says what the evidence is, not a grade. */
export const OBSERVATION_OF: Record<MasteryState, string> = {
  not_started: "Bé chưa học bài nào của kỹ năng này.",
  learning: "Bé đang làm quen với kỹ năng này qua những bài đầu tiên.",
  practicing:
    "Bé đã luyện tập nhiều lần và làm đúng phần lớn câu ngay lần đầu.",
  mastered:
    "Bé làm đúng hầu hết câu ngay lần đầu, qua nhiều buổi học khác nhau.",
  review:
    "Bé từng làm rất tốt kỹ năng này; gần đây nên ôn lại một chút cùng bé.",
};

/** Learning time for parents, e.g. "12 phút", "1 giờ 5 phút", "Dưới 1 phút". */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0 phút";
  if (seconds < 60) return "Dưới 1 phút";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}

const timeFmt = new Intl.DateTimeFormat("vi-VN", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
/** dd/mm[/yyyy] in the app time zone (ICU's vi-VN short form uses dashes). */
function dayMonth(at: Date, withYear = false): string {
  const [y, m, d] = dateKeyIn(at).split("-");
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}

/** "Hôm nay, 17:20" · "Hôm qua, 19:05" · "12/11, 08:30" (app time zone). */
export function formatWhen(iso: string, now: Date): string {
  const at = new Date(iso);
  const day = dateKeyIn(at);
  const today = dateKeyIn(now);
  const yesterday = dateKeyIn(new Date(now.getTime() - 86_400_000));
  const time = timeFmt.format(at);
  if (day === today) return `Hôm nay, ${time}`;
  if (day === yesterday) return `Hôm qua, ${time}`;
  return `${dayMonth(at)}, ${time}`;
}

export function formatDate(iso: string): string {
  return `Ngày ${dayMonth(new Date(iso), true)}`;
}

export function weekTotals(report: ChildReport) {
  return report.last7.reduce(
    (acc, d) => ({
      sessions: acc.sessions + d.sessions,
      seconds: acc.seconds + d.seconds,
    }),
    { sessions: 0, seconds: 0 },
  );
}

/**
 * Where to begin after the placement activity: the first world (in catalogue
 * order) with the least-familiar observation. A suggestion, not a level.
 */
export function suggestedStart(
  summary: AssessmentSummary,
  order: readonly string[],
): string | undefined {
  const rank: Record<MasteryBand, number> = {
    not_started: 0,
    exploring: 1,
    developing: 2,
    confident: 3,
  };
  const known = summary.modules.filter((m) => order.includes(m.moduleId));
  if (known.length === 0) return undefined;
  return [...known].sort(
    (a, b) =>
      rank[a.band] - rank[b.band] ||
      order.indexOf(a.moduleId) - order.indexOf(b.moduleId),
  )[0]!.moduleId;
}
