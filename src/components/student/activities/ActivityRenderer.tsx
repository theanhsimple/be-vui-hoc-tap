"use client";

import { ChoiceActivity } from "./ChoiceActivity";
import {
  MatchingActivity,
  MemoryActivity,
  OrderingActivity,
  PatternActivity,
} from "./StructuredActivities";
import type { ActivityProps } from "./types";

/**
 * Picks the renderer for a question type. Adding a type = one renderer here
 * plus its content schema; the lesson player doesn't change.
 */
export function ActivityRenderer(props: ActivityProps) {
  const { question } = props;
  switch (question.type) {
    case "single_choice":
    case "image_choice":
      return <ChoiceActivity {...props} question={question} />;
    case "matching":
      return <MatchingActivity {...props} question={question} />;
    case "ordering":
      return <OrderingActivity {...props} question={question} />;
    case "pattern":
      return <PatternActivity {...props} question={question} />;
    case "memory":
      return <MemoryActivity {...props} question={question} />;
  }
}
