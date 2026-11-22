import type { BadgeTone } from "../ui/LittleBadge";

/** Mastery bands from DATABASE_SCHEMA.md §7. Observations, never grades or scores. */
export type MasteryBand =
  "not_started" | "exploring" | "developing" | "confident";

export const MASTERY_BANDS: readonly MasteryBand[] = [
  "not_started",
  "exploring",
  "developing",
  "confident",
];

export const MASTERY_LABEL: Record<MasteryBand, string> = {
  not_started: "Chưa bắt đầu",
  exploring: "Đang khám phá",
  developing: "Đang tiến bộ",
  confident: "Tự tin",
};

export const MASTERY_TONE: Record<MasteryBand, BadgeTone> = {
  not_started: "neutral",
  exploring: "creative",
  developing: "info",
  confident: "success",
};
