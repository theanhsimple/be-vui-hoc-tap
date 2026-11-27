import type { Metadata } from "next";

import { DevicePrivacy } from "@/device/pages/misc";

export const metadata: Metadata = { title: "Quyền riêng tư" };

export default function Page() {
  return <DevicePrivacy />;
}
