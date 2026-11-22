import type { Metadata } from "next";

import { HomeScreen } from "@/components/student/home/HomeScreen";
import { contentRepository } from "@/features/learning/content/repository";

export const metadata: Metadata = { title: "Trang chủ" };

export default function StudentHomePage() {
  return <HomeScreen catalog={contentRepository.getCatalog()} />;
}
