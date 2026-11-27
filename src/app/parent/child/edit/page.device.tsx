import type { Metadata } from "next";
import { Suspense } from "react";

import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { ParentArea, DeviceChildEdit } from "@/device/pages/parent";

export const metadata: Metadata = { title: "Sửa hồ sơ của bé" };

export default function Page() {
  return (
    <ParentArea current="family">
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <DeviceChildEdit />
      </Suspense>
    </ParentArea>
  );
}
