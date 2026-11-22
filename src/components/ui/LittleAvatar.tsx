import { cn } from "@/lib/cn";

import { LittleIllustration } from "./LittleIllustration";

export const AVATAR_KEYS = [
  "sun",
  "cloud",
  "leaf",
  "flower",
  "moon",
  "drop",
] as const;
export type AvatarKey = (typeof AVATAR_KEYS)[number];

const SIZE = { sm: 32, md: 48, lg: 72, xl: 96 } as const;

export interface LittleAvatarProps {
  name: string;
  /** Child avatars come from a fixed catalogue (no photos). Adults fall back to initials. */
  avatar?: AvatarKey;
  size?: keyof typeof SIZE;
  /** True when the name is already visible next to the avatar. */
  decorative?: boolean;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function LittleAvatar({
  name,
  avatar,
  size = "md",
  decorative,
  className,
}: LittleAvatarProps) {
  const px = SIZE[size];
  if (avatar) {
    return (
      <span
        className={cn("inline-block shrink-0 rounded-pill", className)}
        style={{ width: px, height: px }}
      >
        {decorative ? (
          <LittleIllustration name={`avatar.${avatar}`} size={px} decorative />
        ) : (
          <LittleIllustration name={`avatar.${avatar}`} size={px} alt={name} />
        )}
      </span>
    );
  }
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-pill bg-lavender-50 font-extrabold text-lavender-strong",
        size === "sm"
          ? "text-caption"
          : size === "md"
            ? "text-body"
            : "text-h2",
        className,
      )}
      style={{ width: px, height: px }}
    >
      {initials(name)}
    </span>
  );
}
