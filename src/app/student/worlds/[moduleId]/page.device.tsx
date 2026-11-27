import { deviceContent } from "@/device/content";
import { DeviceWorld } from "@/device/pages/student";

export const dynamicParams = false;
export function generateStaticParams() {
  return deviceContent().catalog.worlds.map((w) => ({ moduleId: w.id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  return <DeviceWorld moduleId={moduleId} />;
}
