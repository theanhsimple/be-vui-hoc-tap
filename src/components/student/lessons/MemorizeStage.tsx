"use client";

import { Eye } from "lucide-react";
import { useEffect } from "react";

import type { Visual } from "@/features/learning/types";
import { useAudio } from "@/lib/audio";

import { LittleButton } from "../../ui/LittleButton";
import { VisualView } from "../VisualView";

/** "Look and remember": shows the visuals for a few seconds, then hands over to the question. */
export function MemorizeStage({
  visuals,
  seconds,
  onDone,
}: {
  visuals: Visual[];
  seconds: number;
  onDone: () => void;
}) {
  const { play } = useAudio();
  useEffect(() => {
    void play({ text: "Con hãy nhìn thật kỹ và nhớ nhé!", lang: "vi-VN" });
    const t = setTimeout(onDone, seconds * 1000);
    return () => clearTimeout(t);
  }, [seconds, onDone, play]);

  return (
    <section
      aria-label="Hãy nhớ nhé"
      className="flex flex-col items-center gap-6 rounded-xl bg-lavender-50 p-6 shadow-sm"
    >
      <h2 className="flex items-center gap-2 text-h1">
        <Eye aria-hidden className="size-8 text-lavender-strong" /> Hãy nhớ nhé!
      </h2>
      <div className="flex flex-wrap justify-center gap-4">
        {visuals.map((v, i) => (
          <span
            key={i}
            className="grid w-[clamp(96px,20vw,180px)] place-items-center rounded-xl bg-surface p-4 shadow-sm"
          >
            <VisualView visual={v} />
          </span>
        ))}
      </div>
      <div
        aria-hidden
        className="h-3 w-full max-w-md overflow-hidden rounded-pill bg-surface"
      >
        <div
          className="h-full origin-left rounded-pill bg-lavender motion-reduce:[animation:none]"
          style={{ animation: `little-countdown ${seconds}s linear forwards` }}
        />
      </div>
      <LittleButton variant="secondary" size="lg" onClick={onDone}>
        Con nhớ rồi
      </LittleButton>
    </section>
  );
}
