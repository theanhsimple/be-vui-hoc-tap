import type { Metadata } from "next";

import { RewardsScreen } from "@/components/student/rewards/RewardsScreen";
import { contentRepository } from "@/features/learning/content/repository";

export const metadata: Metadata = { title: "Phần thưởng" };

export default function RewardsPage() {
  return <RewardsScreen catalog={contentRepository.getCatalog()} />;
}
