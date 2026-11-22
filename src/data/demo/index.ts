import type { WorldSource } from "./helpers";
import { alphabetForest } from "./worlds/alphabet-forest";
import { challengeArena } from "./worlds/challenge-arena";
import { englishIsland } from "./worlds/english-island";
import { iqCastle } from "./worlds/iq-castle";
import { memoryGarden } from "./worlds/memory-garden";
import { numberKingdom } from "./worlds/number-kingdom";
import { schoolTown } from "./worlds/school-town";

/** Public demo content, in world order. Contains no answer keys. */
export const DEMO_WORLD_SOURCES: readonly WorldSource[] = [
  alphabetForest,
  numberKingdom,
  iqCastle,
  memoryGarden,
  englishIsland,
  schoolTown,
  challengeArena,
];
