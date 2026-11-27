import type { Metadata } from "next";

import { DeviceExplore } from "@/device/pages/student";

export const metadata: Metadata = { title: "Khám phá" };

export default function Page() {
  return <DeviceExplore />;
}
