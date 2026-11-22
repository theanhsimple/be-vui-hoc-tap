import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TOUCH_TARGET } from "@/design-system/tokens";

import { ANSWER_SIZE, AnswerOption } from "./AnswerOption";

describe("AnswerOption", () => {
  it("exposes its label and state", () => {
    render(
      <AnswerOption label="Hình tròn" state="selected">
        o
      </AnswerOption>,
    );
    const b = screen.getByRole("button", { name: "Hình tròn" });
    expect(b.getAttribute("data-state")).toBe("selected");
    expect(b.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onSelect while open", () => {
    const onSelect = vi.fn();
    render(
      <AnswerOption label="x" onSelect={onSelect}>
        x
      </AnswerOption>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it.each(["correct", "reveal", "dimmed"] as const)(
    "ignores taps once %s",
    (state) => {
      const onSelect = vi.fn();
      render(
        <AnswerOption label="x" state={state} onSelect={onSelect}>
          x
        </AnswerOption>,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByRole("button").getAttribute("aria-disabled")).toBe(
        "true",
      );
    },
  );

  it("try-again keeps the option selectable (another chance)", () => {
    const onSelect = vi.fn();
    render(
      <AnswerOption label="x" state="tryAgain" onSelect={onSelect}>
        x
      </AnswerOption>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it.each(Object.entries(ANSWER_SIZE))(
    "size %s never shrinks below the child touch target",
    (size, s) => {
      expect(s.min).toBeGreaterThanOrEqual(TOUCH_TARGET.child);
      render(
        <AnswerOption label="x" size={size as keyof typeof ANSWER_SIZE}>
          x
        </AnswerOption>,
      );
      expect(screen.getByRole("button").style.width).toBe(
        `clamp(${s.min}px, ${s.vw}vw, ${s.max}px)`,
      );
    },
  );
});
