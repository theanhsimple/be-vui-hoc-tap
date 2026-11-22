"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { useAudio } from "@/lib/audio";

import { LittleButton } from "../ui/LittleButton";
import { LittleIllustration } from "../ui/LittleIllustration";
import { AnswerOption } from "./AnswerOption";
import { SlotTile } from "./SlotTile";
import type { ActivityItem, ActivityStatus } from "./types";

export interface SequenceBuilderProps {
  /** Items to order, in the order they are offered (already shuffled by the caller). */
  items: readonly ActivityItem[];
  status?: ActivityStatus;
  /** Correct order to show when status is "reveal" (comes from the server after the last try). */
  revealOrder?: readonly string[];
  /** Change on every submission so try-again feedback replays. */
  attempt?: number;
  onSubmit: (orderedIds: string[]) => void;
  submitLabel?: string;
}

/**
 * Put items in order by tapping: tap an item to place it in the next slot,
 * tap a placed item to take it back. Works with touch, mouse and keyboard
 * (no dragging required — WCAG 2.5.7).
 */
export function SequenceBuilder({
  items,
  status = "editing",
  revealOrder,
  attempt = 0,
  onSubmit,
  submitLabel = "Xong",
}: SequenceBuilderProps) {
  const { playSfx } = useAudio();
  const [placed, setPlaced] = useState<(string | null)[]>(() =>
    items.map(() => null),
  );
  const byId = new Map(items.map((i) => [i.id, i]));
  const [editedAfter, setEditedAfter] = useState(-1);
  const showTryAgain = status === "tryAgain" && editedAfter !== attempt;
  const locked = status === "correct" || status === "reveal";
  const order = status === "reveal" && revealOrder ? revealOrder : placed;
  const full = placed.every(Boolean);

  const place = (id: string) => {
    const slot = placed.indexOf(null);
    if (slot === -1) return;
    playSfx("tap");
    setEditedAfter(attempt);
    setPlaced((p) => p.map((v, i) => (i === slot ? id : v)));
  };
  const remove = (slot: number) => {
    playSfx("tap");
    setEditedAfter(attempt);
    setPlaced((p) => p.map((v, i) => (i === slot ? null : v)));
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <ol aria-label="Thứ tự" className="flex flex-wrap justify-center gap-3">
        {order.map((id, i) => {
          const item = id ? byId.get(id) : undefined;
          const state =
            status === "reveal"
              ? "reveal"
              : status === "correct"
                ? "correct"
                : showTryAgain && item
                  ? "tryAgain"
                  : item
                    ? "filled"
                    : "empty";
          return (
            <li key={i}>
              <SlotTile
                position={i + 1}
                item={item}
                state={state}
                feedbackKey={attempt}
                onPress={item && !locked ? () => remove(i) : undefined}
              />
            </li>
          );
        })}
      </ol>

      {!locked && (
        <div
          aria-label="Các thẻ để xếp"
          role="group"
          className="flex flex-wrap justify-center gap-3"
        >
          {items.map((item) =>
            placed.includes(item.id) ? (
              <span
                key={item.id}
                aria-hidden
                className="aspect-square w-[clamp(96px,22vw,144px)] rounded-xl border-3 border-dashed border-border"
              />
            ) : (
              <AnswerOption
                key={item.id}
                label={item.label}
                size="md"
                onSelect={() => place(item.id)}
              >
                <LittleIllustration name={item.illustration} decorative />
              </AnswerOption>
            ),
          )}
        </div>
      )}

      {!locked && (
        <LittleButton
          size="xl"
          variant="success"
          iconStart={<Check strokeWidth={3} />}
          disabled={!full}
          onClick={() =>
            onSubmit(placed.filter((v): v is string => v !== null))
          }
        >
          {submitLabel}
        </LittleButton>
      )}
    </div>
  );
}
