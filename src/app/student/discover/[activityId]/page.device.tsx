import { deviceContent } from "@/device/content";
import { DeviceDiscover } from "@/device/pages/student";

export const dynamicParams = false;
export function generateStaticParams() {
  return [{ activityId: deviceContent().placement.id }];
}

export default function Page() {
  return <DeviceDiscover />;
}
