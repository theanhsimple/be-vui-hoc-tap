import type { Metadata } from "next";

import { ExploreScreen } from "@/components/student/worlds/ExploreScreen";
import { contentRepository } from "@/features/learning/content/repository";

export const metadata: Metadata = { title: "Khám phá" };

export default function ExplorePage() {
  return <ExploreScreen catalog={contentRepository.getCatalog()} />;
}
