import type { AudioSource } from "@/lib/audio";
import { cn } from "@/lib/cn";

import { SpeechBubble } from "../ui/SpeechBubble";
import { AudioPlayer } from "./AudioPlayer";
import { LittleMascot, type MascotState } from "./LittleMascot";

export interface AudioInstructionProps {
  /** Caption of what the child hears (for parents; the child relies on audio). */
  text: string;
  /** Defaults to speaking `text` with the browser voice — mark `demo` until recorded audio exists. */
  source?: AudioSource;
  mascotState?: MascotState;
  autoPlay?: boolean;
  demo?: boolean;
  className?: string;
}

/** Mascot + caption bubble + replay button: the standard spoken instruction row. */
export function AudioInstruction({
  text,
  source,
  mascotState = "talk",
  autoPlay,
  demo,
  className,
}: AudioInstructionProps) {
  return (
    <div className={cn("flex items-center gap-3 tablet:gap-4", className)}>
      <LittleMascot
        state={mascotState}
        className="hidden size-24 shrink-0 tablet:block"
      />
      <SpeechBubble className="flex-1">{text}</SpeechBubble>
      <AudioPlayer
        source={source ?? { text, lang: "vi-VN" }}
        autoPlay={autoPlay}
        demo={demo}
      />
    </div>
  );
}
