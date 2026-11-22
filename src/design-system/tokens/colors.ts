/**
 * Colour tokens — TypeScript mirror of src/styles/tokens.css (kept in sync by
 * tokens.test.ts). Use CSS classes/variables in components; this module is for
 * documentation, the showcase and contrast tests.
 */

export const BRAND = {
  blue: {
    base: "#72A9EC",
    tint: "#EAF2FC",
    edge: "#5A92D8",
    strong: "#2B6AB8",
  },
  yellow: {
    base: "#FFD16A",
    tint: "#FFF4D6",
    edge: "#E8B44A",
    strong: "#93620F",
  },
  coral: {
    base: "#FF927C",
    tint: "#FFEDE9",
    edge: "#E87862",
    strong: "#A84D3A",
  },
  mint: {
    base: "#8BD5B0",
    tint: "#E8F6EF",
    edge: "#6DBB94",
    strong: "#357552",
  },
  lavender: {
    base: "#B9A7EA",
    tint: "#F1EDFB",
    edge: "#9C88D6",
    strong: "#6B52C7",
  },
} as const;

export type BrandTone = keyof typeof BRAND;
export const BRAND_TONES = Object.keys(BRAND) as BrandTone[];

/** What each brand colour means in the product (decorative vs functional). */
export const BRAND_ROLE: Record<BrandTone, string> = {
  blue: "Primary Blue — main actions, navigation",
  yellow: "Sunshine Yellow — rewards, highlights",
  coral: "Soft Coral — attention, encouragement (never 'wrong')",
  mint: "Mint Green — success, progress",
  lavender: "Lavender — logic, creativity",
};

export const SEMANTIC = {
  canvas: "#FFF8EC",
  surface: "#FFFFFF",
  surfaceMuted: "#FAF6EE",
  surfaceEdge: "#E4DCCB",
  ink: "#293447",
  inkMuted: "#5F6A7D",
  border: "#E9E8E3",
  borderStrong: "#868E9C",
  focus: "#2B6AB8",
  success: "#64B98D",
  success50: "#E8F6EF",
  successStrong: "#357552",
  warning: "#F1B85B",
  warning50: "#FFF4D6",
  warningStrong: "#93620F",
  error: "#E77979",
  error50: "#FDEEEE",
  errorStrong: "#B34848",
  disabled: "#F1EFEA",
  disabledInk: "#868E9C",
  skyTop: "#DCEBFB",
} as const;

/** Adjustments made to the brief's palette, for accessibility. */
export const ADJUSTMENTS = [
  {
    token: "--ink-muted",
    from: "#748094",
    to: "#5F6A7D",
    reason:
      "Text Secondary was 3.8:1 on cream; small text needs 4.5:1 (now 5.2:1).",
  },
  {
    token: "--*-strong",
    from: "brand base colours",
    to: "darker 'strong' variants",
    reason:
      "Brand colours are 1.7–2.7:1 on cream, too low for text, links, icons or focus rings. Strong variants reach ≥ 4.5:1.",
  },
  {
    token: "--border-strong",
    from: "#E9E8E3 (Border)",
    to: "#868E9C for control boundaries",
    reason:
      "Input and control borders need 3:1 (WCAG 1.4.11); #E9E8E3 is 1.2:1 and stays decorative only.",
  },
  {
    token: "text on fills",
    from: "white text",
    to: "always --ink",
    reason: "White text is 1.4–2.8:1 on every brand fill; --ink is 4.4–8.7:1.",
  },
  {
    token: "--error fill",
    from: "--ink text on #E77979 (4.4:1)",
    to: "--error-50 tint + --error-strong text",
    reason: "Error messages use the tint with strong text instead of the fill.",
  },
] as const;

/** Pairs that must meet a minimum contrast ratio. Checked in tokens.test.ts. */
export const CONTRAST_REQUIREMENTS: ReadonlyArray<{
  fg: string;
  bg: string;
  min: number;
  use: string;
}> = [
  {
    fg: SEMANTIC.ink,
    bg: SEMANTIC.canvas,
    min: 4.5,
    use: "body text on canvas",
  },
  {
    fg: SEMANTIC.inkMuted,
    bg: SEMANTIC.canvas,
    min: 4.5,
    use: "secondary text on canvas",
  },
  {
    fg: SEMANTIC.inkMuted,
    bg: SEMANTIC.surface,
    min: 4.5,
    use: "secondary text on cards",
  },
  ...Object.entries(BRAND).flatMap(([name, t]) => [
    { fg: SEMANTIC.ink, bg: t.base, min: 4.5, use: `text on ${name} fill` },
    { fg: SEMANTIC.ink, bg: t.tint, min: 4.5, use: `text on ${name} tint` },
    {
      fg: SEMANTIC.inkMuted,
      bg: t.tint,
      min: 4.5,
      use: `secondary text on ${name} tint`,
    },
    {
      fg: t.strong,
      bg: SEMANTIC.canvas,
      min: 4.5,
      use: `${name}-strong text on canvas`,
    },
    {
      fg: t.strong,
      bg: SEMANTIC.surface,
      min: 4.5,
      use: `${name}-strong text on surface`,
    },
    {
      fg: t.strong,
      bg: t.tint,
      min: 4.5,
      use: `${name}-strong text on ${name} tint (badges)`,
    },
  ]),
  {
    fg: SEMANTIC.focus,
    bg: SEMANTIC.canvas,
    min: 3,
    use: "focus ring on canvas",
  },
  {
    fg: SEMANTIC.focus,
    bg: SEMANTIC.surface,
    min: 3,
    use: "focus ring on surface",
  },
  {
    fg: SEMANTIC.borderStrong,
    bg: SEMANTIC.surface,
    min: 3,
    use: "control border on surface",
  },
  {
    fg: SEMANTIC.successStrong,
    bg: SEMANTIC.success50,
    min: 4.5,
    use: "success message",
  },
  {
    fg: SEMANTIC.warningStrong,
    bg: SEMANTIC.warning50,
    min: 4.5,
    use: "warning message",
  },
  {
    fg: SEMANTIC.errorStrong,
    bg: SEMANTIC.error50,
    min: 4.5,
    use: "error message (parent/admin)",
  },
  {
    fg: SEMANTIC.ink,
    bg: SEMANTIC.success,
    min: 4.5,
    use: "text on success fill",
  },
  {
    fg: SEMANTIC.ink,
    bg: SEMANTIC.warning,
    min: 4.5,
    use: "text on warning fill",
  },
];

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) =>
    channel(parseInt(h.slice(i, i + 2), 16)),
  );
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** WCAG 2.x contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi! + 0.05) / (lo! + 0.05);
}
