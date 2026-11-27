import { EXPANSION } from "./expansion";
import type { WorldSource } from "./helpers";
import { alphabetForest } from "./worlds/alphabet-forest";
import { challengeArena } from "./worlds/challenge-arena";
import { englishIsland } from "./worlds/english-island";
import { iqCastle } from "./worlds/iq-castle";
import { memoryGarden } from "./worlds/memory-garden";
import { numberKingdom } from "./worlds/number-kingdom";
import { schoolTown } from "./worlds/school-town";

/** Appends the release-2 lessons (expansion.ts) after each skill's lessons. */
const withExpansion = (w: WorldSource): WorldSource => ({
  ...w,
  skills: w.skills.map((s) => ({
    ...s,
    lessons: [...s.lessons, ...(EXPANSION[s.id] ?? [])],
  })),
});

/** Public demo content, in world order. Contains no answer keys. */
export const DEMO_WORLD_SOURCES: readonly WorldSource[] = [
  alphabetForest,
  numberKingdom,
  iqCastle,
  memoryGarden,
  englishIsland,
  schoolTown,
  challengeArena,
].map(withExpansion);
