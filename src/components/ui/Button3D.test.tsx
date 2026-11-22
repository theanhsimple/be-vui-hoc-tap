import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button3D, IconButton3D } from "./Button3D";

describe("Button3D", () => {
  it("defaults to type=button so it never submits forms by accident", () => {
    render(<Button3D>Chơi</Button3D>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });

  it("uses the kid size floor classes (72px) for kid buttons", () => {
    render(<Button3D size="kid">Chơi</Button3D>);
    expect(screen.getByRole("button").className).toMatch(/\bmin-h-18\b/);
  });

  it("does not fire clicks when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button3D disabled onClick={onClick}>
        Chơi
      </Button3D>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("IconButton3D", () => {
  it("requires and applies an accessible label", () => {
    render(
      <IconButton3D label="Nghe lại">
        <svg />
      </IconButton3D>,
    );
    expect(screen.getByRole("button", { name: "Nghe lại" })).toBeTruthy();
  });
});
