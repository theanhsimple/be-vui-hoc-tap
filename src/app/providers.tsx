"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { AudioProvider } from "@/lib/audio";

/** Client-side app providers. Motion honours the OS "reduce motion" setting. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AudioProvider>{children}</AudioProvider>
    </MotionConfig>
  );
}
