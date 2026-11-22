/**
 * Touch-target sizes (px). Kid mode never goes below KID_TARGET_MIN
 * (docs/UX_UI_SPECIFICATION.md §3.4); parent/admin never below PARENT_TARGET_MIN.
 */
export const KID_TARGET_MIN = 64;
export const PARENT_TARGET_MIN = 44;

export const BIG_CHOICE_SIZE = { md: 140, lg: 180, xl: 220 } as const;
export type BigChoiceSize = keyof typeof BIG_CHOICE_SIZE;
