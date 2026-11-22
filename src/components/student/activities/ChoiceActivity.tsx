"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { AnswerOption } from "@/components/learning/AnswerOption";
import type { AnswerState } from "@/components/learning/types";
import { LittleButton } from "@/components/ui/LittleButton";
import type { LearningQuestion } from "@/features/learning/types";
import { useAudio } from "@/lib/audio";

import { VisualView } from "../VisualView";
import type { ActivityProps } from "./types";

type ChoiceQuestion = Extract<
  LearningQuestion,
  { type: "single_choice" | "image_choice" }
>;

/**
 * single_choice: tap to select; with `confirm`, a "Xong" button submits.
 * image_choice: tapping a picture submits immediately.
 */
export function ChoiceActivity({
  question,
  status,
  attempt,
  locked,
  reveal,
  eliminated,
  onSubmit,
}: ActivityProps<ChoiceQuestion>) {
  const { playSfx } = useAudio();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const confirm = question.type === "single_choice" && question.config.confirm;
  const submit = (optionId: string) => {
    setSubmitted(optionId);
    onSubmit({ type: question.type, optionId });
  };

  const stateOf = (id: string): AnswerState => {
    if (status === "correct") return id === submitted ? "correct" : "dimmed";
    if (status === "reveal")
      return reveal?.type === "choice" && reveal.optionId === id
        ? "reveal"
        : "dimmed";
    if (eliminated.includes(id)) return "dimmed";
    // The wrong pick stays marked until the child chooses something else.
    if (status === "tryAgain" && id === submitted && selected === submitted)
      return "tryAgain";
    if (confirm && id === selected) return "selected";
    return "idle";
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        role="group"
        aria-label="Các lựa chọn"
        className="flex flex-wrap items-center justify-center gap-3 tablet:gap-6"
      >
        {question.options.map((o) => (
          <AnswerOption
            key={o.id}
            label={o.label}
            state={stateOf(o.id)}
            feedbackKey={attempt}
            disabled={
              eliminated.includes(o.id) &&
              status !== "reveal" &&
              status !== "correct"
            }
            onSelect={
              locked
                ? undefined
                : () => {
                    setSelected(o.id);
                    if (confirm) playSfx("tap");
                    else submit(o.id);
                  }
            }
          >
            <VisualView visual={o.visual} />
          </AnswerOption>
        ))}
      </div>
      {confirm && status !== "correct" && status !== "reveal" && (
        <LittleButton
          size="xl"
          variant="success"
          iconStart={<Check strokeWidth={3} />}
          disabled={!selected || locked || stateOf(selected) === "tryAgain"}
          onClick={() => selected && submit(selected)}
        >
          Xong
        </LittleButton>
      )}
    </div>
  );
}
