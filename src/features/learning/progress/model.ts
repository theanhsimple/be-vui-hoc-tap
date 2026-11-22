/** Per-child learning progress. Demo: stored on the device. Sprint 04: learning_sessions, question_attempts, child_rewards. */

export interface QuestionResult {
  questionId: string;
  /** Answered correctly (on any try). */
  correct: boolean;
  /** Correct on the first try. */
  firstTry: boolean;
  attempts: number;
}

export interface LessonRecord {
  lessonId: string;
  worldId: string;
  firstCompletedAt: string;
  lastCompletedAt: string;
  bestStars: number;
  plays: number;
  last: {
    stars: number;
    total: number;
    correct: number;
    firstTry: number;
    newRewards: RewardId[];
  };
}

export interface InProgressSession {
  lessonId: string;
  questionIndex: number;
  results: QuestionResult[];
  /** Try number on the current question, so a refresh doesn't reset it. */
  attempt?: number;
  startedAt: string;
}

export type RewardId =
  | "explorer-star"
  | "curious-mind"
  | "little-reader"
  | "number-finder"
  | "memory-master"
  | "brave-challenger";

export type HistoryEvent =
  | { type: "lesson"; lessonId: string; stars: number; at: string }
  | { type: "badge"; rewardId: RewardId; at: string };

export interface ChildProgress {
  lessons: Record<string, LessonRecord>;
  inProgress?: InProgressSession;
  rewards: Array<{ id: RewardId; earnedAt: string }>;
  history: HistoryEvent[];
  dailyPlan?: { date: string; lessonIds: string[] };
  /** Badges earned after this time are celebrated on the rewards screen. */
  rewardsSeenAt?: string;
}

export const emptyProgress = (): ChildProgress => ({
  lessons: {},
  rewards: [],
  history: [],
});
