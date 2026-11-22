"use client";

import { Volume2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import {
  type AudioSource,
  type PlayOutcome,
  sourceKey,
  useAudio,
} from "@/lib/audio";
import { cn } from "@/lib/cn";

import { LittleBadge } from "../ui/LittleBadge";
import { LittleIconButton } from "../ui/LittleIconButton";

export interface AudioPlayerProps {
  /** A recorded file, or text for the speech-synthesis fallback — at least one. */
  source: AudioSource;
  /** Play once as soon as audio is unlocked (again whenever `source` changes). */
  autoPlay?: boolean;
  label?: string;
  size?: "md" | "lg" | "xl";
  /**
   * Marks the control as a demo when no recorded file exists yet, so nobody
   * mistakes browser speech for the production voice-over.
   */
  demo?: boolean;
  onOutcome?: (outcome: PlayOutcome) => void;
  className?: string;
}

/** Play / replay control for a spoken instruction. Always visible in the student experience. */
export function AudioPlayer({
  source,
  autoPlay = false,
  label = "Nghe lại",
  size = "xl",
  demo = false,
  onOutcome,
  className,
}: AudioPlayerProps) {
  const { play, unlocked, playingKey, playSfx } = useAudio();
  const reduce = useReducedMotion();
  const key = sourceKey(source);
  const playing = playingKey === key;

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
    <span
      className={cn(
        "relative inline-flex shrink-0 flex-col items-center gap-1",
        className,
      )}
    >
      <span className="relative inline-grid">
        {playing && !reduce && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-pill ring-4 ring-blue"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        <LittleIconButton
          label={demo ? `${label} (âm thanh demo)` : label}
          icon={<Volume2 />}
          variant="primary"
          size={size}
          aria-pressed={playing}
          data-audio-source={source.src ? "file" : "speech"}
          onClick={() => {
            playSfx("tap");
            void play(source).then((o) => onOutcome?.(o));
          }}
        />
      </span>
      {demo && (
        <LittleBadge tone="warning" size="sm">
          Âm thanh demo
        </LittleBadge>
      )}
    </span>
  );
}
