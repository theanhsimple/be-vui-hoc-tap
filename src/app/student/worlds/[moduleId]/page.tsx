import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorldDetailScreen } from "@/components/student/worlds/WorldDetailScreen";
import { contentRepository } from "@/features/learning/content/repository";

export function generateStaticParams() {
  return contentRepository.getCatalog().worlds.map((w) => ({ moduleId: w.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/student/worlds/[moduleId]">): Promise<Metadata> {
  const { moduleId } = await params;
  return { title: contentRepository.getWorld(moduleId)?.nameVi ?? "Thế giới" };
}

export default async function WorldPage({
  params,
}: PageProps<"/student/worlds/[moduleId]">) {
  const { moduleId } = await params;
  const world = contentRepository.getWorld(moduleId);
  if (!world) notFound();
  return <WorldDetailScreen world={world} />;
}
