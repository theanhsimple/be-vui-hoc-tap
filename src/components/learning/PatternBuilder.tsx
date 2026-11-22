"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { useAudio } from "@/lib/audio";

import { LittleButton } from "../ui/LittleButton";
import { LittleIllustration } from "../ui/LittleIllustration";
import { AnswerOption } from "./AnswerOption";
import { SlotTile } from "./SlotTile";
import type { ActivityItem, ActivityStatus } from "./types";

export type PatternCell = { item: ActivityItem } | { blank: true };

export interface PatternBuilderProps {
  /** The pattern with given items and blanks, left to right. */
  sequence: readonly PatternCell[];
  /** Items the child can place; each may be used any number of times. */
  palette: readonly ActivityItem[];
  status?: ActivityStatus;
  /** Item id for each blank, shown when status is "reveal". */
  revealFills?: readonly string[];
  attempt?: number;
  onSubmit: (fills: string[]) => void;
  submitLabel?: string;
}

/** Complete a pattern: tap a blank to choose it, tap a palette item to fill it. */
export function PatternBuilder({
  sequence,
  palette,
  status = "editing",
  revealFills,
  attempt = 0,
  onSubmit,
  submitLabel = "Xong",
}: PatternBuilderProps) {
  const { playSfx } = useAudio();
  const blanks = sequence.filter((c) => "blank" in c).length;
  const [fills, setFills] = useState<(string | null)[]>(() =>
    Array.from({ length: blanks }, () => null),
  );
  const [active, setActive] = useState(0);
  const byId = new Map(palette.map((i) => [i.id, i]));
  const [editedAfter, setEditedAfter] = useState(-1);
  const showTryAgain = status === "tryAgain" && editedAfter !== attempt;
  const locked = status === "correct" || status === "reveal";
  const shown = status === "reveal" && revealFills ? revealFills : fills;

  const fill = (id: string) => {
    playSfx("tap");
    setEditedAfter(attempt);
    const target = fills[active] === null ? active : fills.indexOf(null);
    if (target === -1) return;
    const next = fills.map((v, i) => (i === target ? id : v));
    setFills(next);
    const nextEmpty = next.indexOf(null);
    setActive(nextEmpty === -1 ? target : nextEmpty);
  };

  let blankIndex = -1;
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <ol aria-label="Dãy hình" className="flex flex-wrap justify-center gap-3">
        {sequence.map((cell, i) => {
          if ("item" in cell) {
            return (
              <li key={i}>
                <SlotTile position={i + 1} item={cell.item} state="fixed" />
              </li>
            );
          }
          const b = ++blankIndex;
          const id = shown[b];
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
                    : b === active
                      ? "active"
                      : "empty";
          return (
            <li key={i}>
              <SlotTile
                position={i + 1}
                item={item}
                state={state}
                feedbackKey={attempt}
                onPress={
                  locked
                    ? undefined
                    : () => {
                        playSfx("tap");
                        setActive(b);
                        if (item) setEditedAfter(attempt);
                        if (item)
                          setFills((f) =>
                            f.map((v, j) => (j === b ? null : v)),
                          );
                      }
                }
              />
            </li>
          );
        })}
      </ol>

      {!locked && (
        <>
          <div
            role="group"
            aria-label="Chọn hình để điền"
            className="flex flex-wrap justify-center gap-3"
          >
            {palette.map((item) => (
              <AnswerOption
                key={item.id}
                label={item.label}
                size="md"
                onSelect={() => fill(item.id)}
              >
                <LittleIllustration name={item.illustration} decorative />
              </AnswerOption>
            ))}
          </div>
          <LittleButton
            size="xl"
            variant="success"
            iconStart={<Check strokeWidth={3} />}
            disabled={fills.includes(null)}
            onClick={() =>
              onSubmit(fills.filter((v): v is string => v !== null))
            }
          >
            {submitLabel}
          </LittleButton>
        </>
      )}
    </div>
  );
}
