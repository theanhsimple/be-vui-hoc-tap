import type { Metadata } from "next";

import { ProfilesScreen } from "@/components/student/ProfilesScreen";

export const metadata: Metadata = { title: "Ai đang học?" };

export default function ProfilesPage() {
  return <ProfilesScreen />;
}
