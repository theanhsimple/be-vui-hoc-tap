"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

import { fadeUp } from "@/design-system/motion/presets";

import { Logo } from "../layout/Logo";
import { AudioPlayer } from "../learning/AudioPlayer";
import { LittleMascot } from "../learning/LittleMascot";
import { LittleButton } from "../ui/LittleButton";
import { StudentScreen } from "./StudentScreen";

const GREETING = "Chào bạn nhỏ! Cùng khám phá thế giới học tập nhé!";

/** Screen 01 — no login on the child's welcome screen. */
export function WelcomeScreen() {
  const router = useRouter();
  return (
    <StudentScreen align="center">
      <div className="relative flex flex-col items-center gap-5 py-6 text-center">
        <DriftingClouds />
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Logo className="text-display" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LittleMascot
            state="cheer"
            className="size-40 tablet:size-52"
            label="Bạn Nắng đang vẫy chào"
          />
        </motion.div>
        <div className="flex flex-col gap-1">
          <h1 className="text-display">Chào bạn nhỏ!</h1>
          <p className="text-h2 text-ink-muted">
            Cùng khám phá thế giới học tập nhé!
          </p>
        </div>
        <div className="flex flex-wrap items-start justify-center gap-4">
          <LittleButton
            size="xl"
            iconEnd={<ArrowRight strokeWidth={3} />}
            onClick={() => router.push("/student/profiles")}
            className="min-w-56"
          >
            Bắt đầu
          </LittleButton>
          <AudioPlayer
            source={{ text: GREETING, lang: "vi-VN" }}
            label="Nghe lời chào"
            demo
            size="xl"
          />
        </div>
      </div>
    </StudentScreen>
  );
}

/** One-time drift-in of the clouds (no looping background motion — D-025). */
function DriftingClouds() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full"
    >
      <motion.span
        className="absolute top-[8%] left-[4%] h-10 w-32 rounded-pill bg-surface/80"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.span
        className="absolute top-[22%] right-[6%] h-12 w-40 rounded-pill bg-surface/70"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.1 }}
      />
    </div>
  );
}
