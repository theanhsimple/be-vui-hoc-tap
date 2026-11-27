/**
 * Server-evaluated reward rules (rewards.rule in the database; evaluated on
 * the device in the device edition). Keyed by reward id.
 */
export type RewardRule =
  | { kind: "lessons_completed"; count: number }
  | { kind: "modules_explored"; count: number }
  | { kind: "module_lessons_completed"; module: string; count: number };

export const REWARD_RULES: Record<string, RewardRule> = {
  "explorer-star": { kind: "lessons_completed", count: 1 },
  "curious-mind": { kind: "modules_explored", count: 3 },
  "little-reader": {
    kind: "module_lessons_completed",
    module: "alphabet-forest",
    count: 2,
  },
  "number-finder": {
    kind: "module_lessons_completed",
    module: "number-kingdom",
    count: 2,
  },
  "memory-master": {
    kind: "module_lessons_completed",
    module: "memory-garden",
    count: 2,
  },
  "brave-challenger": {
    kind: "module_lessons_completed",
    module: "challenge-arena",
    count: 1,
  },
};
