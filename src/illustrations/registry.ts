import type { ReactNode } from "react";

import { PLACEHOLDER_ART } from "./placeholders";
import { CONTENT_ART } from "./placeholders-content";

const ART = { ...PLACEHOLDER_ART, ...CONTENT_ART };

/**
 * Illustration registry. Components refer to art by name only
 * (e.g. "world.number-kingdom"), so real 3D renders can replace placeholders
 * without touching component code.
 *
 * Naming convention (docs/DESIGN_SYSTEM.md §12):
 *   {category}.{kebab-name}          → registry key
 *   public/illustrations/{category}/{kebab-name}@2x.webp → file path
 * Categories: world, object, shape, reward, avatar, mascot, state,
 * animal, food, color, routine, badge.
 */

export type IllustrationName = keyof typeof ART;

export type IllustrationAsset =
  | { kind: "placeholder"; render: () => ReactNode }
  | { kind: "image"; src: string; width: number; height: number };

/** Real assets go here as they are delivered; they take precedence over placeholders. */
const ASSETS: Partial<
  Record<IllustrationName, Extract<IllustrationAsset, { kind: "image" }>>
> = {};

export function getIllustration(name: IllustrationName): IllustrationAsset {
  return ASSETS[name] ?? { kind: "placeholder", render: ART[name] };
}

export const ILLUSTRATION_NAMES = Object.keys(ART) as IllustrationName[];

export function assetPath(name: IllustrationName): string {
  const [category, file] = name.split(".");
  return `/illustrations/${category}/${file}@2x.webp`;
}
