import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getServerEnv } from "@/lib/env.server";

import { DesignSystemShowcase } from "./showcase";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

/** Internal component gallery. Hidden in production unless ENABLE_DESIGN_SYSTEM=true. */
export default function DesignSystemPage() {
  if (
    process.env.NODE_ENV === "production" &&
    !getServerEnv().ENABLE_DESIGN_SYSTEM
  ) {
    notFound();
  }
  return <DesignSystemShowcase />;
}
