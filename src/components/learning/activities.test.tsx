import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MatchingGame } from "./MatchingGame";
import { MemoryGame } from "./MemoryGame";
import { PatternBuilder } from "./PatternBuilder";
import { SequenceBuilder } from "./SequenceBuilder";
import type { ActivityItem } from "./types";

const A: ActivityItem = {
  id: "a",
  label: "Hình tròn",
  illustration: "shape.circle",
};
const B: ActivityItem = {
  id: "b",
  label: "Hình vuông",
  illustration: "shape.square",
};
const C: ActivityItem = {
  id: "c",
  label: "Ngôi sao",
  illustration: "shape.star",
};

const tap = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("SequenceBuilder", () => {
  it("places items in tap order and submits the order", () => {
    const onSubmit = vi.fn();
    render(<SequenceBuilder items={[A, B, C]} onSubmit={onSubmit} />);
    const done = screen.getByRole("button", {
      name: "Xong",
    }) as HTMLButtonElement;
    expect(done.disabled).toBe(true);
    tap("Ngôi sao");
    tap("Hình tròn");
    tap("Hình vuông");
    expect(done.disabled).toBe(false);
    fireEvent.click(done);
    expect(onSubmit).toHaveBeenCalledWith(["c", "a", "b"]);
  });

  it("tapping a placed item returns it", () => {
    render(<SequenceBuilder items={[A, B]} onSubmit={() => {}} />);
    tap("Hình tròn");
    tap(/Ô 1: Hình tròn/);
    expect(screen.getByRole("button", { name: "Hình tròn" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Ô 1: trống" })).toBeTruthy();
  });

  it("shows the revealed order and hides controls", () => {
    render(
      <SequenceBuilder
        items={[A, B]}
        status="reveal"
        revealOrder={["b", "a"]}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByRole("img", { name: "Ô 1: Hình vuông" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Xong" })).toBeNull();
  });
});

describe("PatternBuilder", () => {
  it("fills blanks from the palette and submits", () => {
    const onSubmit = vi.fn();
    render(
      <PatternBuilder
        sequence={[{ item: A }, { item: B }, { blank: true }, { blank: true }]}
        palette={[A, B]}
        onSubmit={onSubmit}
      />,
    );
    tap("Hình tròn");
    tap("Hình vuông");
    fireEvent.click(screen.getByRole("button", { name: "Xong" }));
    expect(onSubmit).toHaveBeenCalledWith(["a", "b"]);
  });
});

describe("MatchingGame", () => {
  it("pairs a left item with a right item", () => {
    const onSubmit = vi.fn();
    render(
      <MatchingGame
        left={[A, B]}
        right={[
          { ...B, id: "b2" },
          { ...A, id: "a2" },
        ]}
        onSubmit={onSubmit}
      />,
    );
    const [leftA, rightA] = screen.getAllByRole("button", {
      name: "Hình tròn",
    });
    fireEvent.click(leftA!);
    fireEvent.click(rightA!);
    const [leftB, rightB] = screen.getAllByRole("button", {
      name: "Hình vuông",
    });
    fireEvent.click(rightB!);
    fireEvent.click(leftB!);
    fireEvent.click(screen.getByRole("button", { name: "Xong" }));
    expect(onSubmit).toHaveBeenCalledWith([
      ["a", "a2"],
      ["b", "b2"],
    ]);
  });
});

describe("MemoryGame", () => {
  const cards = [
    {
      id: "1",
      pairKey: "x",
      label: "Hình tròn",
      illustration: "shape.circle" as const,
    },
    {
      id: "2",
      pairKey: "y",
      label: "Ngôi sao",
      illustration: "shape.star" as const,
    },
    {
      id: "3",
      pairKey: "x",
      label: "Hình tròn",
      illustration: "shape.circle" as const,
    },
    {
      id: "4",
      pairKey: "y",
      label: "Ngôi sao",
      illustration: "shape.star" as const,
    },
  ];

  it("keeps matched pairs, turns back mismatches, and completes", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <MemoryGame
        cards={cards}
        columns={2}
        mismatchDelay={500}
        onComplete={onComplete}
      />,
    );
    tap("Thẻ úp số 1");
    tap("Thẻ úp số 2");
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getAllByRole("button", { name: /Thẻ úp/ })).toHaveLength(4);
    tap("Thẻ úp số 1");
    tap("Thẻ úp số 3");
    expect(screen.getAllByRole("button", { name: /đã ghép/ })).toHaveLength(2);
    tap("Thẻ úp số 2");
    tap("Thẻ úp số 4");
    expect(onComplete).toHaveBeenCalledWith({ moves: 3 });
    vi.useRealTimers();
  });
});
