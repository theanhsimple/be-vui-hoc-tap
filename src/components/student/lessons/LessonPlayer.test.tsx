import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_ANSWER_KEYS } from "@/data/demo/answer-keys";
import { demoContentRepository as contentRepository } from "@/data/demo/repository";
import type { SessionState } from "@/features/learning/backend/overview";
import type { QuestionResponse } from "@/features/learning/types";

import { LessonPlayer } from "./LessonPlayer";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/features/auth/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/features/family/actions", () => ({ leaveStudentAction: vi.fn() }));

/**
 * The Server Functions are replaced by a fake server: it grades choice and
 * pattern questions with the demo keys (the real grader runs in PostgreSQL
 * and is covered by test/db). This test covers the player's UI contract.
 */
const calls: Array<{ questionId: string; idempotencyKey: string }> = [];
const tries = new Map<string, number>();
const submitAnswerAction = vi.fn(
  async (input: {
    sessionId: string;
    questionId: string;
    response: QuestionResponse;
    idempotencyKey: string;
  }) => {
    calls.push(input);
    const key = DEMO_ANSWER_KEYS[input.questionId]!;
    const r = input.response;
    const correct =
      key.type === "choice"
        ? "optionId" in r && r.optionId === key.optionId
        : key.type === "pattern" && "fills" in r
          ? r.fills.join() === key.fills.join()
          : false;
    const attempt = (tries.get(input.questionId) ?? 0) + 1;
    tries.set(input.questionId, attempt);
    const final = correct || attempt >= 2;
    return {
      ok: true as const,
      correct,
      final,
      message: correct
        ? "Đúng rồi!"
        : final
          ? "Cùng xem đáp án nhé."
          : "Gần đúng rồi! Con thử lại nhé.",
      reveal:
        final && !correct && key.type === "choice"
          ? { type: "choice" as const, optionId: key.optionId }
          : undefined,
      nextAction: final ? ("continue" as const) : ("retry" as const),
    };
  },
);
const requestHintAction = vi.fn(async () => ({
  ok: true as const,
  text: "Hình tròn không có góc nhọn.",
  eliminateOptionId: "a",
}));
vi.mock("@/features/learning/backend/actions", () => ({
  submitAnswerAction: (i: never) => submitAnswerAction(i),
  requestHintAction: () => requestHintAction(),
}));

const lesson = contentRepository.getLesson("nk-l3")!; // image_choice, image_choice, pattern
const world = contentRepository.getWorld("number-kingdom")!;
const SESSION = "11111111-1111-4111-8111-111111111111";
const fresh: SessionState = {
  sessionId: SESSION,
  lessonId: "nk-l3",
  status: "in_progress",
  currentIndex: 0,
  total: 3,
  startedAt: "2026-11-22T08:00:00Z",
  attempt: 1,
  results: [],
};

const tap = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("LessonPlayer (server-graded session)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
    tries.clear();
  });

  it("plays a full lesson: correct, try-again then correct, pattern, then opens the result", async () => {
    render(<LessonPlayer lesson={lesson} world={world} session={fresh} />);

    expect(screen.getByText("Đâu là hình tròn?")).toBeTruthy();
    tap("Hình tròn");
    await screen.findByText(/Đúng rồi/);
    tap("Tiếp tục");

    await screen.findByText("Đâu là hình tam giác?");
    tap("Hình tròn");
    await screen.findByText(/thử lại/);
    expect(screen.queryByRole("button", { name: "Tiếp tục" })).toBeNull(); // cannot skip ahead
    tap("Hình tam giác");
    await screen.findByRole("button", { name: "Tiếp tục" });
    tap("Tiếp tục");

    await screen.findByText("Chọn hình tiếp theo.");
    fireEvent.click(
      screen.getAllByRole("button", { name: "Hình tròn" }).at(-1)!,
    );
    tap("Xong");
    await screen.findByRole("button", { name: "Xem kết quả" });
    tap("Xem kết quả");

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        `/student/lessons/nk-l3/result?session=${SESSION}`,
      ),
    );
    // Each try had its own idempotency key; the client never sends a score.
    expect(new Set(calls.map((c) => c.idempotencyKey)).size).toBe(calls.length);
    expect(calls.every((c) => !("attempt" in c) && !("correct" in c))).toBe(
      true,
    );
  });

  it("reuses the idempotency key when a request fails, so the answer is recorded once", async () => {
    submitAnswerAction.mockRejectedValueOnce(new Error("network"));
    render(<LessonPlayer lesson={lesson} world={world} session={fresh} />);
    tap("Hình tròn");
    await screen.findByText("Mạng đang chậm. Con thử lại nhé.");
    tap("Hình tròn");
    await screen.findByText(/Đúng rồi/);
    expect(submitAnswerAction).toHaveBeenCalledTimes(2);
    expect(submitAnswerAction.mock.calls[0]![0].idempotencyKey).toBe(
      submitAnswerAction.mock.calls[1]![0].idempotencyKey,
    );
  });

  it("reloads from the server when the session is stale", async () => {
    submitAnswerAction.mockResolvedValueOnce({
      ok: false,
      code: "question_mismatch",
    } as never);
    render(<LessonPlayer lesson={lesson} world={world} session={fresh} />);
    tap("Hình tròn");
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/student/lessons/nk-l3"),
    );
  });

  it("asks before exiting and keeps progress", async () => {
    render(<LessonPlayer lesson={lesson} world={world} session={fresh} />);
    tap("Dừng lại");
    expect(
      await screen.findByRole("dialog", { name: "Con muốn dừng lại không?" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Dừng lại" }).at(-1)!,
    );
    expect(router.push).toHaveBeenCalledWith("/student/worlds/number-kingdom");
  });

  it("hint fades out one wrong option", async () => {
    render(<LessonPlayer lesson={lesson} world={world} session={fresh} />);
    tap("Gợi ý");
    await screen.findByText("Hình tròn không có góc nhọn.");
    const faded = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("data-state") === "dimmed");
    expect(faded).toHaveLength(1);
    expect(faded[0]!.getAttribute("aria-label")).not.toBe("Hình tròn");
  });

  it("resumes the server session on the same question and try", async () => {
    await act(async () => {
      render(
        <LessonPlayer
          lesson={lesson}
          world={world}
          session={{
            ...fresh,
            currentIndex: 2,
            attempt: 2,
            results: [
              {
                questionId: "nk-l3-q1",
                correct: true,
                firstTry: true,
                attempts: 1,
              },
              {
                questionId: "nk-l3-q2",
                correct: true,
                firstTry: true,
                attempts: 1,
              },
            ],
          }}
        />,
      );
    });
    expect(screen.getByText("Chọn hình tiếp theo.")).toBeTruthy();
    expect(screen.getByText("Câu 3/3")).toBeTruthy();
  });
});
