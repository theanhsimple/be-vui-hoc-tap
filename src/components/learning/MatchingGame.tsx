"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import type { BrandTone } from "@/design-system/tokens";
import { useAudio } from "@/lib/audio";
import { cn } from "@/lib/cn";

import { LittleButton } from "../ui/LittleButton";
import { ItemArt } from "./ItemArt";
import { AnswerOption } from "./AnswerOption";
import type { ActivityItem, ActivityStatus, AnswerState } from "./types";

/** Each pair gets a colour AND a shape, so pairs never rely on colour alone. */
const MARKERS: ReadonlyArray<{
  tone: BrandTone;
  shape: "circle" | "triangle" | "square" | "star" | "diamond";
}> = [
  { tone: "blue", shape: "circle" },
  { tone: "coral", shape: "triangle" },
  { tone: "mint", shape: "square" },
  { tone: "lavender", shape: "star" },
  { tone: "yellow", shape: "diamond" },
];

const MARKER_FILL: Record<BrandTone, string> = {
  blue: "fill-blue-strong",
  coral: "fill-coral-strong",
  mint: "fill-mint-strong",
  lavender: "fill-lavender-strong",
  yellow: "fill-yellow-strong",
};

function Marker({ index }: { index: number }) {
  const m = MARKERS[index % MARKERS.length]!;
  const paths = {
    circle: <circle cx="12" cy="12" r="8" />,
    triangle: <path d="M12 3l9 17H3z" />,
    square: <rect x="4" y="4" width="16" height="16" rx="3" />,
    star: (
      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z" />
    ),
    diamond: <path d="M12 2l9 10-9 10-9-10z" />,
  };
  return (
    <span
      aria-hidden
      className="absolute -top-2 -left-2 grid size-10 place-items-center rounded-pill bg-surface shadow-sm"
    >
      <svg viewBox="0 0 24 24" className={cn("size-6", MARKER_FILL[m.tone])}>
        {paths[m.shape]}
      </svg>
    </span>
  );
}

export interface MatchingGameProps {
  left: readonly ActivityItem[];
  right: readonly ActivityItem[];
  status?: ActivityStatus;
  /** Correct pairs [leftId, rightId] shown when status is "reveal". */
  revealPairs?: ReadonlyArray<readonly [string, string]>;
  attempt?: number;
  onSubmit: (pairs: Array<[string, string]>) => void;
  submitLabel?: string;
}

/** Match items by tapping one on each side. Tap a matched item to undo. */
export function MatchingGame({
  left,
  right,
  status = "editing",
  revealPairs,
  attempt = 0,
  onSubmit,
  submitLabel = "Xong",
}: MatchingGameProps) {
  const { playSfx } = useAudio();
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);
  const [selected, setSelected] = useState<{
    side: "left" | "right";
    id: string;
  } | null>(null);
  const [editedAfter, setEditedAfter] = useState(-1);
  const showTryAgain = status === "tryAgain" && editedAfter !== attempt;
  const locked = status === "correct" || status === "reveal";
  const shown = status === "reveal" && revealPairs ? revealPairs : pairs;

  const pairIndex = (side: "left" | "right", id: string) =>
    shown.findIndex((p) => p[side === "left" ? 0 : 1] === id);

  const press = (side: "left" | "right", id: string) => {
    playSfx("tap");
    setEditedAfter(attempt);
    const existing = pairIndex(side, id);
    if (existing !== -1) {
      setPairs((p) => p.filter((_, i) => i !== existing));
      setSelected(null);
      return;
    }
    if (selected && selected.side !== side) {
      const pair: [string, string] =
        side === "left" ? [id, selected.id] : [selected.id, id];
      setPairs((p) => [...p, pair]);
      setSelected(null);
      return;
    }
    setSelected(selected?.id === id ? null : { side, id });
  };

  const stateOf = (side: "left" | "right", id: string): AnswerState => {
    const paired = pairIndex(side, id) !== -1;
    if (status === "reveal") return "reveal";
    if (status === "correct") return "correct";
    if (showTryAgain && paired) return "tryAgain";
    if (selected?.side === side && selected.id === id) return "selected";
    return "idle";
  };

  const column = (side: "left" | "right", items: readonly ActivityItem[]) => (
    <div
      role="group"
      aria-label={side === "left" ? "Cột trái" : "Cột phải"}
      className="flex flex-col gap-4"
    >
      {items.map((item) => {
        const idx = pairIndex(side, item.id);
        return (
          <span key={item.id} className="relative">
            <AnswerOption
              label={
                idx === -1
                  ? item.label
                  : `${item.label}, đã ghép cặp ${idx + 1}`
              }
              size="md"
              state={stateOf(side, item.id)}
              feedbackKey={attempt}
              onSelect={locked ? undefined : () => press(side, item.id)}
            >
              <ItemArt item={item} />
            </AnswerOption>
            {idx !== -1 && <Marker index={idx} />}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex justify-center gap-10 tablet:gap-20">
        {column("left", left)}
        {column("right", right)}
      </div>
      {!locked && (
        <LittleButton
          size="xl"
          variant="success"
          iconStart={<Check strokeWidth={3} />}
          disabled={pairs.length < Math.min(left.length, right.length)}
          onClick={() => onSubmit(pairs)}
        >
          {submitLabel}
        </LittleButton>
      )}
    </div>
  );
}
