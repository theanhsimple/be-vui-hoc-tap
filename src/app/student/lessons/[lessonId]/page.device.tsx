import { deviceContent } from "@/device/content";

export const dynamicParams = false;
export function generateStaticParams() {
  return deviceContent().lessonOrder.map((l) => ({ lessonId: l.id }));
}
import { DeviceLessonIntro } from "@/device/pages/student";

export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <DeviceLessonIntro lessonId={lessonId} />;
}
