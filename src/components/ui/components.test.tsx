import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminFormField } from "../admin/AdminFormField";
import { LittleButton } from "./LittleButton";
import { LittleIconButton } from "./LittleIconButton";
import { LittleIllustration } from "./LittleIllustration";
import { LittleInput } from "./LittleInput";
import { LittleModal } from "./LittleModal";
import { LittleProgress } from "./LittleProgress";
import { LittleSwitch } from "./LittleSwitch";

describe("LittleButton", () => {
  it("defaults to type=button", () => {
    render(<LittleButton>Chơi</LittleButton>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });

  it("ignores clicks and announces busy while loading", () => {
    const onClick = vi.fn();
    render(
      <LittleButton loading onClick={onClick}>
        Lưu
      </LittleButton>,
    );
    const b = screen.getByRole("button");
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    expect(b.getAttribute("aria-busy")).toBe("true");
  });

  it("child sizes meet the 56/64 px target via min-height classes", () => {
    render(
      <>
        <LittleButton size="lg">lg</LittleButton>
        <LittleButton size="xl">xl</LittleButton>
      </>,
    );
    expect(screen.getByRole("button", { name: "lg" }).className).toMatch(
      /\bmin-h-14\b/,
    );
    expect(screen.getByRole("button", { name: "xl" }).className).toMatch(
      /\bmin-h-16\b/,
    );
  });
});

describe("LittleIconButton", () => {
  it("has an accessible name", () => {
    render(<LittleIconButton label="Nghe lại" icon={<svg />} />);
    expect(screen.getByRole("button", { name: "Nghe lại" })).toBeTruthy();
  });
});

describe("LittleModal", () => {
  it("focuses the dialog and closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <LittleModal
        open
        onClose={onClose}
        title="Tiêu đề"
        description="Mô tả"
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "Tiêu đề" });
    expect(document.activeElement).toBe(dialog);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("LittleProgress", () => {
  it("clamps and labels the value", () => {
    render(
      <LittleProgress label="Tuần này" value={9} max={5} valueText="5/5" />,
    );
    const bar = screen.getByRole("progressbar", { name: "Tuần này" });
    expect(bar.getAttribute("aria-valuenow")).toBe("5");
  });
});

describe("LittleSwitch", () => {
  it("toggles with role=switch", () => {
    const onChange = vi.fn();
    render(
      <LittleSwitch
        checked={false}
        onCheckedChange={onChange}
        label="Nhạc nền"
      />,
    );
    const sw = screen.getByRole("switch", { name: /Nhạc nền/ });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("AdminFormField", () => {
  it("wires label, hint and error to the control", () => {
    render(
      <AdminFormField label="Tên" hint="Gợi ý" error="Bắt buộc">
        {(f) => (
          <LittleInput
            id={f.id}
            aria-describedby={f["aria-describedby"]}
            invalid={f.invalid}
          />
        )}
      </AdminFormField>,
    );
    const input = screen.getByLabelText("Tên");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const described = input
      .getAttribute("aria-describedby")!
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(["Gợi ý", "Bắt buộc"]);
  });
});

describe("LittleIllustration", () => {
  it("renders a labelled placeholder", () => {
    render(
      <LittleIllustration name="world.number-kingdom" alt="Vương Quốc Số" />,
    );
    const img = screen.getByRole("img", { name: "Vương Quốc Số" });
    expect(img.getAttribute("data-placeholder")).toBe("true");
  });

  it("hides decorative art from assistive tech", () => {
    const { container } = render(
      <LittleIllustration name="shape.circle" decorative />,
    );
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});
