import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { demoStore } from "@/features/learning/store/demoStore";

import { ProfilesScreen } from "./ProfilesScreen";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("ProfilesScreen", () => {
  beforeEach(() => {
    localStorage.clear();
    demoStore._resetForTests();
    vi.clearAllMocks();
  });

  it("shows this family's children and opens home for the chosen one", () => {
    render(<ProfilesScreen />);
    expect(screen.getByText("Hôm nay ai sẽ khám phá?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Bông/ }));
    expect(demoStore.getSnapshot().selectedChildId).toBe("demo-bong");
    expect(router.push).toHaveBeenCalledWith("/student/home");
  });
});
