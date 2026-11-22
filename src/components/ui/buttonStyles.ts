/**
 * Button style tokens shared by LittleButton, LittleIconButton and
 * LittleLinkButton. Kept in a plain module (not "use client") so Server
 * Components can import the class strings too.
 */

export const BUTTON_VARIANTS = {
  primary:
    "bg-blue text-ink [--edge:var(--blue-edge)] edge-3d hover:brightness-[1.04]",
  secondary:
    "bg-surface text-ink [--edge:var(--surface-edge)] edge-3d ring-1 ring-border ring-inset hover:bg-surface-muted",
  reward:
    "bg-yellow text-ink [--edge:var(--yellow-edge)] edge-3d hover:brightness-[1.03]",
  success:
    "bg-mint text-ink [--edge:var(--mint-edge)] edge-3d hover:brightness-[1.03]",
  ghost: "bg-transparent text-blue-strong hover:bg-blue-50",
  danger:
    "bg-error-50 text-error-strong ring-1 ring-error ring-inset hover:brightness-[0.97]",
} as const;

/**
 * Heights: sm 40 (admin dense) · md 48 (parent) · lg 56 (child secondary)
 * · xl 64 (child primary). All exceed the WCAG 2.2 24 px minimum.
 */
export const BUTTON_SIZES = {
  sm: "min-h-10 px-4 gap-1.5 rounded-sm text-body-sm font-bold [--edge-depth:2px]",
  md: "min-h-12 px-5 gap-2 rounded-md text-body font-bold [--edge-depth:3px]",
  lg: "min-h-14 px-6 gap-2 rounded-md text-body-lg font-extrabold [--edge-depth:4px]",
  xl: "min-h-16 px-8 gap-2.5 rounded-lg text-h3 font-extrabold [--edge-depth:4px]",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

export const DISABLED_CLASSES =
  "disabled:bg-disabled disabled:text-disabled-ink disabled:[--edge:var(--border)] disabled:ring-0 disabled:hover:brightness-100 disabled:cursor-not-allowed";
