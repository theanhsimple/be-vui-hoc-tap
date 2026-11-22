"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import {
  type AudioSource,
  type PlayOutcome,
  sourceKey,
  useAudio,
} from "@/lib/audio";
import { cn } from "@/lib/cn";

import { IconButton3D } from "../ui/Button3D";
import { SpeakerIcon } from "../ui/icons";

export interface AudioPromptButtonProps {
  /** A recorded file, or text for the speech-synthesis fallback — at least one. */
  source: AudioSource;
  /** Play once automatically as soon as audio is unlocked (and again when `source` changes). */
  autoPlay?: boolean;
  label?: string;
  size?: "md" | "kid";
  onOutcome?: (outcome: PlayOutcome) => void;
  className?: string;
}

/** Always-visible replay button for the current spoken instruction. */
export function AudioPromptButton({
  source,
  autoPlay = false,
  label = "Nghe lại",
  size = "kid",
  onOutcome,
  className,
}: AudioPromptButtonProps) {
  const { play, unlocked, playingKey, playSfx } = useAudio();
  const reduce = useReducedMotion();
  const key = sourceKey(source);
  const playing = playingKey === key;

  // Keep the latest values without re-triggering auto-play.
  const latest = useRef({ source, onOutcome });
  useEffect(() => {
    latest.current = { source, onOutcome };
  });

  const autoPlayedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!autoPlay || !unlocked || autoPlayedFor.current === key) return;
    autoPlayedFor.current = key;
    void play(latest.current.source).then((o) => latest.current.onOutcome?.(o));
  }, [autoPlay, unlocked, key, play]);

  return (
    <IconButton3D
      label={label}
      tone="sky"
      size={size}
      className={cn("relative shrink-0", className)}
      aria-pressed={playing}
      onClick={() => {
        playSfx("tap");
        void play(source).then((o) => onOutcome?.(o));
      }}
    >
      {playing && !reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full ring-4 ring-sky-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      <SpeakerIcon
        className={size === "kid" ? "size-9" : "size-6"}
        waves={playing ? 2 : 1}
      />
    </IconButton3D>
  );
}
