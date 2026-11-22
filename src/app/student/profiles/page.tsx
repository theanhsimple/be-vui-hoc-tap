import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { ProfilesScreen } from "@/components/student/ProfilesScreen";
import { StudentLoading } from "@/components/student/StudentLoading";
import {
  ageLabel,
  listChildren,
  requireFamily,
  SELECTED_CHILD_COOKIE,
} from "@/features/family/queries";

export const metadata: Metadata = { title: "Ai đang học?" };

export default function ProfilesPage() {
  return (
    <Suspense fallback={<StudentLoading />}>
      <Profiles />
    </Suspense>
  );
}

async function Profiles() {
  await requireFamily("/student/profiles");
  const [children, store] = await Promise.all([listChildren(), cookies()]);
  return (
    <ProfilesScreen
      selectedId={store.get(SELECTED_CHILD_COOKIE)?.value}
      profiles={children.map((c) => ({
        id: c.id,
        nickname: c.nickname,
        avatar: c.avatar,
        ageLabel: ageLabel(c.birthYear) || undefined,
      }))}
    />
  );
}
