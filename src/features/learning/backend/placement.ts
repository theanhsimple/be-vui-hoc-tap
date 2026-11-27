import { z } from "zod";

/** Placement run state (shape returned by start/get_active_assessment). Pure. */
export const placementRunSchema = z.object({
  runId: z.uuid(),
  assessmentId: z.string(),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  currentIndex: z.number().int().min(0),
  total: z.number().int().min(1),
  startedAt: z.string(),
});
export type PlacementRun = z.infer<typeof placementRunSchema>;
