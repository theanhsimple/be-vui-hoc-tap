import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LearningProgress } from "./LearningProgress";

describe("LearningProgress", () => {
  it("reports progress to assistive tech", () => {
    render(<LearningProgress total={6} current={2} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("2");
    expect(bar.getAttribute("aria-valuetext")).toBe("Câu 3 trên 6");
  });

  it("marks done, current and upcoming stones", () => {
    const { container } = render(<LearningProgress total={4} current={1} />);
    const statuses = [...container.querySelectorAll("[data-status]")].map(
      (el) => el.getAttribute("data-status"),
    );
    expect(statuses).toEqual(["done", "current", "upcoming", "upcoming"]);
  });

  it("says finished when complete", () => {
    render(<LearningProgress total={3} current={10} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe(
      "Đã xong",
    );
  });
});
