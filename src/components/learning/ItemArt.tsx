import { LittleIllustration } from "../ui/LittleIllustration";
import type { ActivityItem } from "./types";

/** Draws an activity item: custom content, or its registry illustration. Decorative (the button carries the name). */
export function ItemArt({
  item,
}: {
  item: Pick<ActivityItem, "illustration" | "content">;
}) {
  if (item.content !== undefined) return <>{item.content}</>;
  return item.illustration ? (
    <LittleIllustration name={item.illustration} decorative />
  ) : null;
}
