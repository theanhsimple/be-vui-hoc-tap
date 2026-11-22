import type { IllustrationName } from "@/illustrations/registry";

import type { BrandTone } from "./tokens";

/**
 * The seven Little Explorer learning worlds (visual direction only).
 * Vietnamese names are working drafts pending content review. Which worlds
 * ship in v1 is a content decision (docs/DECISIONS.md P-7).
 */
export interface LearningWorld {
  id: string;
  nameEn: string;
  nameVi: string;
  tone: BrandTone;
  illustration: IllustrationName;
  /** Visual treatment notes for illustrators. */
  visual: string;
}

export const LEARNING_WORLDS: readonly LearningWorld[] = [
  {
    id: "alphabet-forest",
    nameEn: "Alphabet Forest",
    nameVi: "Rừng Chữ Cái",
    tone: "mint",
    illustration: "world.alphabet-forest",
    visual:
      "Soft rounded trees, letter-shaped leaves and signposts; calm greens with warm light.",
  },
  {
    id: "number-kingdom",
    nameEn: "Number Kingdom",
    nameVi: "Vương Quốc Số",
    tone: "yellow",
    illustration: "world.number-kingdom",
    visual:
      "Friendly towers built from counting blocks; sunny yellow with blue accents.",
  },
  {
    id: "iq-castle",
    nameEn: "IQ Castle",
    nameVi: "Lâu Đài Tư Duy",
    tone: "lavender",
    illustration: "world.iq-castle",
    visual:
      "Puzzle-piece walls, pattern windows; lavender stone, gentle and mysterious, never dark.",
  },
  {
    id: "memory-garden",
    nameEn: "Memory Garden",
    nameVi: "Khu Vườn Trí Nhớ",
    tone: "coral",
    illustration: "world.memory-garden",
    visual: "Paired flowers and hidden-card flower beds; coral and mint.",
  },
  {
    id: "english-island",
    nameEn: "English Island",
    nameVi: "Đảo Tiếng Anh",
    tone: "blue",
    illustration: "world.english-island",
    visual:
      "Beach, palm trees, picture-word signs; airy blues with sand cream.",
  },
  {
    id: "school-town",
    nameEn: "School Town",
    nameVi: "Thị Trấn Trường Học",
    tone: "yellow",
    illustration: "world.school-town",
    visual:
      "Small classroom buildings, school bags, routines; warm and reassuring.",
  },
  {
    id: "challenge-arena",
    nameEn: "Challenge Arena",
    nameVi: "Đấu Trường Thử Thách",
    tone: "coral",
    illustration: "world.challenge-arena",
    visual:
      "Mixed-skill review with trophies and stars; celebratory but not competitive between children.",
  },
];
