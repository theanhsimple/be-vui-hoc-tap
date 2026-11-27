import type { Metadata } from "next";
import { Suspense } from "react";

import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { ParentArea, DeviceNewChild } from "@/device/pages/parent";

export const metadata: Metadata = { title: "Thêm hồ sơ bé" };

export default function Page() {
  return (
    <ParentArea current="add">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <DeviceNewChild />
      </Suspense>
    </ParentArea>
  );
}
