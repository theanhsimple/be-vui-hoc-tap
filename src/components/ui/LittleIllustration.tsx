import Image from "next/image";

import {
  type IllustrationName,
  getIllustration,
} from "@/illustrations/registry";
import { cn } from "@/lib/cn";

type A11y =
  { alt: string; decorative?: false } | { decorative: true; alt?: undefined };

export type LittleIllustrationProps = A11y & {
  name: IllustrationName;
  /** Rendered size in px (square). Omit to fill the parent's width. */
  size?: number;
  className?: string;
  /** Load eagerly (above the fold, e.g. the current question). */
  priority?: boolean;
};

/**
 * Renders an illustration by registry name. While real 3D assets are missing,
 * a clearly marked placeholder SVG is drawn (data-placeholder="true").
 */
export function LittleIllustration({
  name,
  size,
  className,
  priority,
  ...a11y
}: LittleIllustrationProps) {
  const asset = getIllustration(name);
  const label = a11y.decorative ? undefined : a11y.alt;
  const style = size ? { width: size, height: size } : undefined;

  if (asset.kind === "image") {
    return (
      <Image
        src={asset.src}
        width={asset.width}
        height={asset.height}
        alt={label ?? ""}
        priority={priority}
        className={cn("h-auto max-w-full", className)}
        style={style}
        data-illustration={name}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-illustration={name}
      data-placeholder="true"
      className={cn(
        "block h-auto max-w-full overflow-visible",
        !size && "w-full",
        className,
      )}
      style={style}
    >
      {asset.render()}
    </svg>
  );
}
