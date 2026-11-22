import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { contentRepository } from "@/features/learning/content/repository";
import { demoStore } from "@/features/learning/store/demoStore";

import { LessonPlayer } from "./LessonPlayer";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const catalog = contentRepository.getCatalog();
const lesson = contentRepository.getLesson("nk-l3")!; // image_choice, image_choice, pattern
const world = contentRepository.getWorld("number-kingdom")!;

const tap = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("LessonPlayer (real grading via server action functions)", () => {
  beforeEach(() => {
    localStorage.clear();
    demoStore._resetForTests();
    demoStore.selectChild("demo-mam");
    vi.clearAllMocks();
  });

  it("plays a full lesson: correct, try-again then correct, pattern, then records stars", async () => {
    render(<LessonPlayer catalog={catalog} lesson={lesson} world={world} />);

    // Q1 "Đâu là hình tròn?" — correct first try
    expect(screen.getByText("Đâu là hình tròn?")).toBeTruthy();
    tap("Hình tròn");
    await screen.findByText(/Đúng rồi|Chính xác/);
    tap("Tiếp tục");

    // Q2 "Đâu là hình tam giác?" — wrong, then right
    await screen.findByText("Đâu là hình tam giác?");
    tap("Hình tròn");
    await screen.findByText(/thử lại/);
    expect(screen.queryByRole("button", { name: "Tiếp tục" })).toBeNull(); // cannot skip ahead
    tap("Hình tam giác");
    await screen.findByRole("button", { name: "Tiếp tục" });
    tap("Tiếp tục");

    // Q3 pattern: circle, square, circle, square, ? → circle
    await screen.findByText("Chọn hình tiếp theo.");
    // In-progress saved after two questions (refresh would resume here).
    expect(
      demoStore.getSnapshot().progress["demo-mam"]?.inProgress,
    ).toMatchObject({ lessonId: "nk-l3", questionIndex: 2 });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Hình tròn" }).at(-1)!,
    );
    tap("Xong");
    await screen.findByRole("button", { name: "Xem kết quả" });
    tap("Xem kết quả");

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        "/student/lessons/nk-l3/result",
      ),
    );
    const record =
      demoStore.getSnapshot().progress["demo-mam"]!.lessons["nk-l3"]!;
    expect(record.last).toMatchObject({
      total: 3,
      correct: 3,
      firstTry: 2,
      stars: 2,
      newRewards: ["explorer-star"],
    });
    expect(
      demoStore.getSnapshot().progress["demo-mam"]!.inProgress,
    ).toBeUndefined();
  });

  it("asks before exiting and keeps progress", async () => {
    render(<LessonPlayer catalog={catalog} lesson={lesson} world={world} />);
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
    render(<LessonPlayer catalog={catalog} lesson={lesson} world={world} />);
    tap("Gợi ý");
    await screen.findByText("Hình tròn không có góc nhọn.");
    const faded = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("data-state") === "dimmed");
    expect(faded).toHaveLength(1);
    expect(faded[0]!.getAttribute("aria-label")).not.toBe("Hình tròn");
  });

  it("resumes where the child left off", async () => {
    demoStore.saveInProgress("demo-mam", {
      lessonId: "nk-l3",
      questionIndex: 2,
      results: [
        { questionId: "nk-l3-q1", correct: true, firstTry: true, attempts: 1 },
        { questionId: "nk-l3-q2", correct: true, firstTry: true, attempts: 1 },
      ],
      startedAt: "2026-11-22T08:00:00Z",
    });
    await act(async () => {
      render(<LessonPlayer catalog={catalog} lesson={lesson} world={world} />);
    });
    expect(screen.getByText("Chọn hình tiếp theo.")).toBeTruthy();
    expect(screen.getByText("Câu 3/3")).toBeTruthy();
  });
});
