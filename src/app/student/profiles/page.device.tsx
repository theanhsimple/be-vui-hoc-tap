import type { Metadata } from "next";

import { DeviceProfiles } from "@/device/pages/student";

export const metadata: Metadata = { title: "Chọn bạn học" };

export default function Page() {
  return <DeviceProfiles />;
}
