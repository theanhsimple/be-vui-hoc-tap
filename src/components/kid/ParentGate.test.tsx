import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HOLD_MS, createChallenge } from "@/lib/parent-gate/challenge";

import { ParentGate } from "./ParentGate";

/** Seeded RNG, reset before each render, so tests know the challenge. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
let rng = seeded(7);
const { target, options, words } = createChallenge(seeded(7));
const wrong = options.find((n) => n !== target)!;

function renderGate() {
  const onPass = vi.fn();
  const onCancel = vi.fn();
  render(
    <ParentGate open onPass={onPass} onCancel={onCancel} rng={() => rng()} />,
  );
  return { onPass, onCancel };
}

describe("ParentGate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    rng = seeded(7);
  });
  afterEach(() => vi.useRealTimers());

  it("renders nothing when closed", () => {
    render(<ParentGate open={false} onPass={() => {}} onCancel={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the target number in words, not digits", () => {
    renderGate();
    expect(screen.getByText(words)).toBeTruthy();
  });

  it("passes after holding the correct number", () => {
    const { onPass } = renderGate();
    fireEvent.pointerDown(screen.getByRole("button", { name: String(target) }));
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(onPass).toHaveBeenCalledOnce();
  });

  it("does not pass on a short tap", () => {
    const { onPass } = renderGate();
    const button = screen.getByRole("button", { name: String(target) });
    fireEvent.pointerDown(button);
    act(() => vi.advanceTimersByTime(HOLD_MS / 3));
    fireEvent.pointerUp(button);
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(onPass).not.toHaveBeenCalled();
  });

  it("holding a wrong number does not pass and shows a retry message", () => {
    const { onPass } = renderGate();
    fireEvent.pointerDown(screen.getByRole("button", { name: String(wrong) }));
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByText(/Chưa đúng/)).toBeTruthy();
  });

  it("supports keyboard hold for adults on desktop", () => {
    const { onPass } = renderGate();
    const button = screen.getByRole("button", { name: String(target) });
    fireEvent.keyDown(button, { key: "Enter" });
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(onPass).toHaveBeenCalledOnce();
  });

  it("closes on Escape and on the close button", () => {
    const { onCancel } = renderGate();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
