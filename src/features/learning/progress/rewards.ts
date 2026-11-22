import type { IllustrationName } from "@/illustrations/registry";

import type { Catalog } from "../types";
import type { ChildProgress, RewardId } from "./model";

export interface RewardDefinition {
  id: RewardId;
  name: string;
  nameEn: string;
  /** How to earn it — effort-based, never "score" based. */
  criteria: string;
  illustration: IllustrationName;
  /** Returns current/target so the UI can show a gentle progress hint. */
  progress: (
    p: ChildProgress,
    catalog: Catalog,
  ) => { current: number; target: number };
}

const completedIn = (p: ChildProgress, worldId: string) =>
  Object.values(p.lessons).filter((l) => l.worldId === worldId).length;

export const REWARDS: readonly RewardDefinition[] = [
  {
    id: "explorer-star",
    name: "Ngôi sao Khám phá",
    nameEn: "Explorer Star",
    criteria: "Hoàn thành bài học đầu tiên",
    illustration: "badge.explorer-star",
    progress: (p) => ({
      current: Math.min(Object.keys(p.lessons).length, 1),
      target: 1,
    }),
  },
  {
    id: "curious-mind",
    name: "Trí tò mò",
    nameEn: "Curious Mind",
    criteria: "Học ở 3 thế giới khác nhau",
    illustration: "badge.curious-mind",
    progress: (p) => ({
      current: Math.min(
        new Set(Object.values(p.lessons).map((l) => l.worldId)).size,
        3,
      ),
      target: 3,
    }),
  },
  {
    id: "little-reader",
    name: "Bạn đọc nhí",
    nameEn: "Little Reader",
    criteria: "Hoàn thành 2 bài ở Rừng Chữ Cái",
    illustration: "badge.little-reader",
    progress: (p) => ({
      current: Math.min(completedIn(p, "alphabet-forest"), 2),
      target: 2,
    }),
  },
  {
    id: "number-finder",
    name: "Người tìm số",
    nameEn: "Number Finder",
    criteria: "Hoàn thành 2 bài ở Vương Quốc Số",
    illustration: "badge.number-finder",
    progress: (p) => ({
      current: Math.min(completedIn(p, "number-kingdom"), 2),
      target: 2,
    }),
  },
  {
    id: "memory-master",
    name: "Bậc thầy ghi nhớ",
    nameEn: "Memory Master",
    criteria: "Hoàn thành 2 bài ở Khu Vườn Trí Nhớ",
    illustration: "badge.memory-master",
    progress: (p) => ({
      current: Math.min(completedIn(p, "memory-garden"), 2),
      target: 2,
    }),
  },
  {
    id: "brave-challenger",
    name: "Dũng sĩ thử thách",
    nameEn: "Brave Challenger",
    criteria: "Hoàn thành 1 bài ở Đấu Trường Thử Thách",
    illustration: "badge.brave-challenger",
    progress: (p) => ({
      current: Math.min(completedIn(p, "challenge-arena"), 1),
      target: 1,
    }),
  },
];

export function rewardById(id: RewardId): RewardDefinition {
  return REWARDS.find((r) => r.id === id)!;
}

/** Badges whose criteria are met but which haven't been awarded yet. */
export function newlyEarned(p: ChildProgress, catalog: Catalog): RewardId[] {
  const have = new Set(p.rewards.map((r) => r.id));
  return REWARDS.filter((r) => {
    if (have.has(r.id)) return false;
    const { current, target } = r.progress(p, catalog);
    return current >= target;
  }).map((r) => r.id);
}
