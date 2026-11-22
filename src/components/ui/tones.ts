/**
 * Colour tones for 3D surfaces: top face + extruded edge (--edge).
 * Class strings are written out in full so Tailwind can detect them.
 */
export const TONES = {
  sky: "bg-sky-400 text-ink-900 [--edge:var(--sky-600)]",
  butter: "bg-butter-400 text-ink-900 [--edge:var(--butter-600)]",
  mint: "bg-mint-400 text-ink-900 [--edge:var(--mint-600)]",
  lilac: "bg-lilac-400 text-ink-900 [--edge:var(--lilac-600)]",
  rose: "bg-rose-400 text-ink-900 [--edge:var(--rose-600)]",
  peach: "bg-peach-400 text-ink-900 [--edge:var(--peach-600)]",
  cream: "bg-cream-50 text-ink-900 [--edge:var(--cream-edge)]",
} as const;

export type Tone = keyof typeof TONES;
export const TONE_NAMES = Object.keys(TONES) as Tone[];
