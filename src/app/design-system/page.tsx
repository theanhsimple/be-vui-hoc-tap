import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getServerEnv } from "@/lib/env.server";

import { Showcase } from "./sections/Showcase";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

/**
 * Internal design-system showcase for product & engineering review.
 * Hidden in production builds unless ENABLE_DESIGN_SYSTEM=true at build time.
 */
export default function DesignSystemPage() {
  if (
    process.env.NODE_ENV === "production" &&
    !getServerEnv().ENABLE_DESIGN_SYSTEM
  ) {
    notFound();
  }
  return <Showcase />;
}
