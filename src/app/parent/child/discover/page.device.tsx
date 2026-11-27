import type { Metadata } from "next";
import { Suspense } from "react";

import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { ParentArea, DeviceDiscoverIntro } from "@/device/pages/parent";

export const metadata: Metadata = { title: "Hoạt động khám phá" };

export default function Page() {
  return (
    <ParentArea current="family">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <DeviceDiscoverIntro />
      </Suspense>
    </ParentArea>
  );
}
