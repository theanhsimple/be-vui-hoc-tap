import type { BrandTone } from "@/design-system/tokens";

/**
 * Fill tones for soft-3D surfaces: background + matching extruded edge (--edge).
 * Text on any fill is always --ink (white text fails contrast on every fill).
 * Class strings are written out in full so Tailwind can detect them.
 */
export const FILL: Record<BrandTone | "surface", string> = {
  blue: "bg-blue text-ink [--edge:var(--blue-edge)]",
  yellow: "bg-yellow text-ink [--edge:var(--yellow-edge)]",
  coral: "bg-coral text-ink [--edge:var(--coral-edge)]",
  mint: "bg-mint text-ink [--edge:var(--mint-edge)]",
  lavender: "bg-lavender text-ink [--edge:var(--lavender-edge)]",
  surface: "bg-surface text-ink [--edge:var(--surface-edge)]",
};

/** Light tint backgrounds with strong-colour text (badges, feedback, selection). */
export const TINT: Record<BrandTone, string> = {
  blue: "bg-blue-50 text-blue-strong",
  yellow: "bg-yellow-50 text-yellow-strong",
  coral: "bg-coral-50 text-coral-strong",
  mint: "bg-mint-50 text-mint-strong",
  lavender: "bg-lavender-50 text-lavender-strong",
};

export type FillTone = keyof typeof FILL;
