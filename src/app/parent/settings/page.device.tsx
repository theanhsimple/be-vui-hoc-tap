import type { Metadata } from "next";

import { ParentArea } from "@/device/pages/parent";
import { DeviceSettings } from "@/device/pages/settings";

export const metadata: Metadata = { title: "Cài đặt" };

export default function Page() {
  return (
    <ParentArea current="settings">
      <DeviceSettings />
    </ParentArea>
  );
}
