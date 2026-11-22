import type { Metadata } from "next";

import { WelcomeScreen } from "@/components/student/WelcomeScreen";

export const metadata: Metadata = { title: "Chào bạn nhỏ" };

export default function WelcomePage() {
  return <WelcomeScreen />;
}
