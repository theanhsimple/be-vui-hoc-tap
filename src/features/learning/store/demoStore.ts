import { z } from "zod";

import type { AvatarKey } from "@/components/ui/LittleAvatar";

import {
  type ChildProgress,
  emptyProgress,
  type InProgressSession,
} from "../progress/model";

/**
 * DEMO SESSION STORE — device-local (localStorage), for the Sprint 03 demo.
 * It is NOT secure storage and NOT the source of truth: nothing here is sent
 * to a server. In Sprint 04 profiles come from Supabase (RLS-scoped to the
 * signed-in guardian's family) and progress from learning_sessions /
 * question_attempts / child_rewards via the ProgressRepository interface.
 */

export interface DemoChild {
  id: string;
  nickname: string;
  avatar: AvatarKey;
  ageLabel?: string;
}

export interface DemoState {
  version: 1;
  children: DemoChild[];
  selectedChildId: string | null;
  progress: Record<string, ChildProgress>;
}

export const STORAGE_KEY = "little.demo.v1";

export const DEMO_CHILDREN: readonly DemoChild[] = [
  { id: "demo-mam", nickname: "Mầm Nhỏ", avatar: "sun", ageLabel: "5 tuổi" },
  { id: "demo-bong", nickname: "Bông", avatar: "flower", ageLabel: "6 tuổi" },
  { id: "demo-tom", nickname: "Tôm", avatar: "cloud", ageLabel: "5 tuổi" },
];

export const seedState = (): DemoState => ({
  version: 1,
  children: DEMO_CHILDREN.map((c) => ({ ...c })),
  selectedChildId: null,
  progress: {},
});

const resultSchema = z.object({
  questionId: z.string(),
  correct: z.boolean(),
  firstTry: z.boolean(),
  attempts: z.number(),
});
const progressSchema = z.object({
  lessons: z.record(
    z.string(),
    z.object({
      lessonId: z.string(),
      worldId: z.string(),
      firstCompletedAt: z.string(),
      lastCompletedAt: z.string(),
      bestStars: z.number(),
      plays: z.number(),
      last: z.object({
        stars: z.number(),
        total: z.number(),
        correct: z.number(),
        firstTry: z.number(),
        newRewards: z.array(z.string()),
      }),
    }),
  ),
  inProgress: z
    .object({
      lessonId: z.string(),
      questionIndex: z.number(),
      results: z.array(resultSchema),
      attempt: z.number().optional(),
      startedAt: z.string(),
    })
    .optional(),
  rewards: z.array(z.object({ id: z.string(), earnedAt: z.string() })),
  history: z.array(
    z
      .object({ type: z.enum(["lesson", "badge"]), at: z.string() })
      .passthrough(),
  ),
  dailyPlan: z
    .object({ date: z.string(), lessonIds: z.array(z.string()) })
    .optional(),
  rewardsSeenAt: z.string().optional(),
});
const stateSchema = z.object({
  version: z.literal(1),
  children: z.array(
    z.object({
      id: z.string(),
      nickname: z.string().max(20),
      avatar: z.enum(["sun", "cloud", "leaf", "flower", "moon", "drop"]),
      ageLabel: z.string().optional(),
    }),
  ),
  selectedChildId: z.string().nullable(),
  progress: z.record(z.string(), progressSchema),
});

/** Parses stored JSON; anything unexpected falls back to a fresh demo. */
export function parseState(raw: string | null): DemoState {
  if (!raw) return seedState();
  try {
    const parsed = stateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as DemoState) : seedState();
  } catch {
    return seedState();
  }
}

// ── External store ──────────────────────────────────────────────────────

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function load(): DemoState {
  if (!state) {
    let raw: string | null = null;
    try {
      raw = storage()?.getItem(STORAGE_KEY) ?? null;
    } catch {
      raw = null;
    }
    state = parseState(raw);
  }
  return state;
}

function commit(next: DemoState) {
  state = next;
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota: keep working in memory for this visit.
  }
  for (const l of listeners) l();
}

export const demoStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        state = parseState(e.newValue);
        listener();
      }
    };
    if (typeof window !== "undefined")
      window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined")
        window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: (): DemoState => load(),
  getServerSnapshot: (): DemoState | null => null,

  selectChild(childId: string | null) {
    const s = load();
    if (childId !== null && !s.children.some((c) => c.id === childId)) return;
    commit({ ...s, selectedChildId: childId });
  },
  updateProgress(childId: string, update: (p: ChildProgress) => ChildProgress) {
    const s = load();
    if (!s.children.some((c) => c.id === childId)) return;
    commit({
      ...s,
      progress: {
        ...s.progress,
        [childId]: update(s.progress[childId] ?? emptyProgress()),
      },
    });
  },
  saveInProgress(childId: string, session: InProgressSession | undefined) {
    demoStore.updateProgress(childId, (p) => ({ ...p, inProgress: session }));
  },
  reset() {
    commit(seedState());
  },
  /** Test helper. */
  _resetForTests() {
    state = null;
    listeners.clear();
  },
};
