import type { Metadata } from "next";

import { DeviceHome } from "@/device/pages/student";

export const metadata: Metadata = { title: "Nhà của bé" };

export default function Page() {
  return <DeviceHome />;
}
