/** Typography, spacing, radius, elevation and breakpoint tokens (mirror of tokens.css). */

export const TYPE_SCALE = [
  {
    token: "display",
    className: "text-display",
    size: "36px (28px on mobile)",
    weight: 800,
    use: "Hero titles, child numerals",
  },
  {
    token: "h1",
    className: "text-h1",
    size: "30px (24px on mobile)",
    weight: 800,
    use: "Page titles",
  },
  {
    token: "h2",
    className: "text-h2",
    size: "24px (20px on mobile)",
    weight: 800,
    use: "Section titles, child speech bubble",
  },
  {
    token: "h3",
    className: "text-h3",
    size: "20px",
    weight: 700,
    use: "Card titles",
  },
  {
    token: "body-lg",
    className: "text-body-lg",
    size: "18px",
    weight: 600,
    use: "Lead text, large buttons",
  },
  {
    token: "body",
    className: "text-body",
    size: "16px",
    weight: 500,
    use: "Default text",
  },
  {
    token: "body-sm",
    className: "text-body-sm",
    size: "14px",
    weight: 500,
    use: "Secondary text, dense tables",
  },
  {
    token: "caption",
    className: "text-caption",
    size: "12px",
    weight: 600,
    use: "Labels, metadata (never essential info for children)",
  },
] as const;

/** 4px base. Tailwind spacing utilities: n × 4px (e.g. p-6 = 24px). */
export const SPACING = [4, 8, 12, 16, 24, 32, 40, 48, 64] as const;

export const RADIUS = { sm: 12, md: 16, lg: 24, xl: 32, pill: 999 } as const;

export const ELEVATION = [
  { token: "shadow-xs", use: "Subtle border-like lift (inputs, chips)" },
  { token: "shadow-sm", use: "Cards, small controls" },
  { token: "shadow-md", use: "Floating panels, popovers, toasts" },
  { token: "shadow-lg", use: "Modals and prominent overlays" },
] as const;

export const BREAKPOINTS = { tablet: 640, desktop: 1024, wide: 1440 } as const;

export const TOUCH_TARGET = { min: 44, child: 64 } as const;
