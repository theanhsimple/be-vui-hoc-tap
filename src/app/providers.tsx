"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/LittleToast";
import { AudioProvider } from "@/lib/audio";

/** Client-side app providers. Motion honours the OS "reduce motion" setting. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AudioProvider>
        <ToastProvider>{children}</ToastProvider>
      </AudioProvider>
    </MotionConfig>
  );
}
