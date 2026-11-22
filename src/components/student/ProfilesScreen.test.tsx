import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilesScreen } from "./ProfilesScreen";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const selectChildAction = vi.fn();
vi.mock("@/features/family/actions", () => ({
  selectChildAction: (id: string) => selectChildAction(id),
  leaveStudentAction: vi.fn(),
}));
vi.mock("@/features/auth/actions", () => ({ signOutAction: vi.fn() }));

const profiles = [
  { id: "c1", nickname: "Mầm Nhỏ", avatar: "sun" as const, ageLabel: "5 tuổi" },
  { id: "c2", nickname: "Bông", avatar: "flower" as const },
];

describe("ProfilesScreen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the family's children and selects through the server", async () => {
    selectChildAction.mockResolvedValue(undefined);
    render(<ProfilesScreen profiles={profiles} />);
    expect(screen.getByText("Hôm nay ai sẽ khám phá?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Bông/ }));
    await waitFor(() => expect(selectChildAction).toHaveBeenCalledWith("c2"));
  });

  it("shows a calm message when selection is refused", async () => {
    selectChildAction.mockResolvedValue({
      ok: false,
      message: "Không tìm thấy hồ sơ của bé.",
    });
    render(<ProfilesScreen profiles={profiles} />);
    fireEvent.click(screen.getByRole("button", { name: /Mầm Nhỏ/ }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Không tìm thấy hồ sơ của bé.",
    );
  });

  it("guides parents when there are no profiles yet", () => {
    render(<ProfilesScreen profiles={[]} />);
    expect(screen.getByText("Chưa có hồ sơ của bé")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Tạo hồ sơ cho bé" })
        .getAttribute("href"),
    ).toBe("/parent/children/new");
  });
});
