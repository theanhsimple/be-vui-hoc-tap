import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BigChoice } from "./BigChoice";
import { BIG_CHOICE_SIZE, KID_TARGET_MIN } from "./sizes";

describe("BigChoice", () => {
  it("exposes the Vietnamese label and current state", () => {
    render(
      <BigChoice label="Quả táo" state="selected">
        🍎
      </BigChoice>,
    );
    const button = screen.getByRole("button", { name: "Quả táo" });
    expect(button.getAttribute("data-state")).toBe("selected");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onSelect while the question is open", () => {
    const onSelect = vi.fn();
    render(
      <BigChoice label="Quả táo" onSelect={onSelect}>
        🍎
      </BigChoice>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it.each(["correct", "dimmed"] as const)("ignores taps once %s", (state) => {
    const onSelect = vi.fn();
    render(
      <BigChoice label="Quả táo" state={state} onSelect={onSelect}>
        🍎
      </BigChoice>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it.each(Object.entries(BIG_CHOICE_SIZE))(
    "size %s renders at %ipx (≥ kid minimum)",
    (size, px) => {
      expect(px).toBeGreaterThanOrEqual(KID_TARGET_MIN);
      render(
        <BigChoice label="x" size={size as keyof typeof BIG_CHOICE_SIZE}>
          x
        </BigChoice>,
      );
      const button = screen.getByRole("button");
      expect(button.style.width).toBe(`${px}px`);
      expect(button.style.height).toBe(`${px}px`);
    },
  );
});
