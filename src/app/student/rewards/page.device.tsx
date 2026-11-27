import type { Metadata } from "next";

import { DeviceRewards } from "@/device/pages/student";

export const metadata: Metadata = { title: "Phần thưởng" };

export default function Page() {
  return <DeviceRewards />;
}
