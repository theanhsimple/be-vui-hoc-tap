import { safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it.each([
    ["/student/home", "/student/home"],
    ["/parent/children/abc?x=1", "/parent/children/abc?x=1"],
  ])("keeps %s", (input, out) => {
    expect(safeNextPath(input)).toBe(out);
  });

  it.each([
    "https://evil.example/",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "student/home",
    "/auth/callback?code=x",
    "/a\u0000b",
    "",
    undefined,
    42,
  ])("rejects %s", (input) => {
    expect(safeNextPath(input)).toBe("/parent");
  });
});
