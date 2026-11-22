import type { ActivityItem } from "@/components/learning/types";
import type { QuestionOption } from "@/features/learning/types";

import { VisualView } from "../VisualView";

/** Adapts a content option to the Sprint 02 activity components. */
export function toItem(o: QuestionOption): ActivityItem {
  return o.visual.kind === "illustration"
    ? { id: o.id, label: o.label, illustration: o.visual.name }
    : { id: o.id, label: o.label, content: <VisualView visual={o.visual} /> };
}
