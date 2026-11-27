import type { Metadata } from "next";
import { Suspense } from "react";

import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { ParentArea, DeviceFamily } from "@/device/pages/parent";

export const metadata: Metadata = { title: "Gia đình" };

export default function Page() {
  return (
    <ParentArea current="family">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <DeviceFamily />
      </Suspense>
    </ParentArea>
  );
}
