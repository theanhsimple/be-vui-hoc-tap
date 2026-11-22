import type { Metadata } from "next";
import { Suspense } from "react";

import { ChildForm } from "@/components/parent/ChildForm";
import { LittleCard } from "@/components/ui/LittleCard";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { createChildAction } from "@/features/family/actions";
import { requireFamily } from "@/features/family/queries";
import { ParentFrame } from "@/components/parent/ParentFrame";

export const metadata: Metadata = { title: "Thêm hồ sơ bé" };

export default function NewChildPage() {
  return (
    <ParentFrame currentId="add">
      <LittleCard
        padding="lg"
        className="mx-auto flex w-full max-w-2xl flex-col gap-4"
      >
        <h1 className="text-h1">Thêm hồ sơ cho bé</h1>
        <Suspense fallback={<LittleStatePanel kind="loading" />}>
          <NewChild />
        </Suspense>
      </LittleCard>
    </ParentFrame>
  );
}

async function NewChild() {
  await requireFamily("/parent/children/new");
  return (
    <ChildForm
      action={createChildAction}
      submitLabel="Tạo hồ sơ"
      currentYear={new Date().getUTCFullYear()}
    />
  );
}
