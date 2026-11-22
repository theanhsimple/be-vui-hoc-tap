"use client";

import { MatchingGame } from "@/components/learning/MatchingGame";
import { MemoryGame } from "@/components/learning/MemoryGame";
import { PatternBuilder } from "@/components/learning/PatternBuilder";
import { SequenceBuilder } from "@/components/learning/SequenceBuilder";
import type { LearningQuestion } from "@/features/learning/types";

import { VisualView } from "../VisualView";
import { toItem } from "./toItem";
import type { ActivityProps } from "./types";

type Q<T extends LearningQuestion["type"]> = Extract<
  LearningQuestion,
  { type: T }
>;

export function MatchingActivity({
  question,
  status,
  attempt,
  reveal,
  onSubmit,
}: ActivityProps<Q<"matching">>) {
  return (
    <MatchingGame
      left={question.config.left.map(toItem)}
      right={question.config.right.map(toItem)}
      status={status}
      attempt={attempt}
      revealPairs={reveal?.type === "matching" ? reveal.pairs : undefined}
      onSubmit={(pairs) => onSubmit({ type: "matching", pairs })}
    />
  );
}

export function OrderingActivity({
  question,
  status,
  attempt,
  reveal,
  onSubmit,
}: ActivityProps<Q<"ordering">>) {
  return (
    <SequenceBuilder
      items={question.config.items.map(toItem)}
      status={status}
      attempt={attempt}
      revealOrder={reveal?.type === "ordering" ? reveal.order : undefined}
      onSubmit={(order) => onSubmit({ type: "ordering", order })}
    />
  );
}

export function PatternActivity({
  question,
  status,
  attempt,
  reveal,
  onSubmit,
}: ActivityProps<Q<"pattern">>) {
  return (
    <PatternBuilder
      sequence={question.config.sequence.map((o) =>
        o ? { item: toItem(o) } : { blank: true as const },
      )}
      palette={question.config.palette.map(toItem)}
      status={status}
      attempt={attempt}
      revealFills={reveal?.type === "pattern" ? reveal.fills : undefined}
      onSubmit={(fills) => onSubmit({ type: "pattern", fills })}
    />
  );
}

export function MemoryActivity({
  question,
  locked,
  onSubmit,
}: ActivityProps<Q<"memory">>) {
  return (
    <MemoryGame
      cards={question.config.cards.map((c) =>
        c.visual.kind === "illustration"
          ? {
              id: c.id,
              pairKey: c.pairKey,
              label: c.label,
              illustration: c.visual.name,
            }
          : {
              id: c.id,
              pairKey: c.pairKey,
              label: c.label,
              content: <VisualView visual={c.visual} />,
            },
      )}
      columns={question.config.columns}
      peekAfterMismatches={question.config.peekAfterMismatches}
      onComplete={({ moves, pairs }) => {
        if (!locked) onSubmit({ type: "memory", moves, pairs });
      }}
    />
  );
}
