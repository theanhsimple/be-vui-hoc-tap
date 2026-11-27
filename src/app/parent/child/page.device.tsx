import type { Metadata } from "next";
import { Suspense } from "react";

import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { ParentArea, DeviceChildReport } from "@/device/pages/parent";

export const metadata: Metadata = { title: "Tiến độ của bé" };

export default function Page() {
  return (
    <ParentArea current="family">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <DeviceChildReport />
      </Suspense>
    </ParentArea>
  );
}
