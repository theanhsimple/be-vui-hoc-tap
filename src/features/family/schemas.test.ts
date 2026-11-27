import { childSchema, familySchema, parsePreferences } from "./schemas";
import { loginSchema, registerSchema } from "../auth/schemas";

describe("family & child validation", () => {
  it("requires consent and a sensible family name", () => {
    expect(
      familySchema.safeParse({ displayName: "  Nhà   Mầm ", consent: "on" })
        .data?.displayName,
    ).toBe("Nhà Mầm");
    expect(familySchema.safeParse({ displayName: "Nhà Mầm" }).success).toBe(
      false,
    );
    expect(
      familySchema.safeParse({ displayName: "", consent: "on" }).success,
    ).toBe(false);
  });

  it("collects only minimal child data", () => {
    const ok = childSchema.parse({
      nickname: " Bông ",
      avatar: "flower",
      birthYear: "",
    });
    expect(ok).toEqual({
      nickname: "Bông",
      avatar: "flower",
      birthYear: null,
      voice: false,
      sounds: false,
      sessionMinutes: null,
    });
    expect(
      childSchema.parse({
        nickname: "A",
        avatar: "sun",
        birthYear: "",
        sessionMinutes: "15",
      }).sessionMinutes,
    ).toBe(15);
    expect(
      childSchema.safeParse({
        nickname: "A",
        avatar: "sun",
        birthYear: "",
        sessionMinutes: "99",
      }).success,
    ).toBe(false);
    expect(
      childSchema.safeParse({
        nickname: "x".repeat(21),
        avatar: "sun",
        birthYear: "",
      }).success,
    ).toBe(false);
    expect(
      childSchema.safeParse({ nickname: "A", avatar: "photo", birthYear: "" })
        .success,
    ).toBe(false);
    expect(
      childSchema.safeParse({ nickname: "A", avatar: "sun", birthYear: "1990" })
        .success,
    ).toBe(false);
  });

  it("defaults preferences safely", () => {
    const base = { voice: true, sounds: true, sessionMinutes: null };
    expect(parsePreferences(null)).toEqual(base);
    expect(parsePreferences({ voice: false })).toEqual({
      ...base,
      voice: false,
    });
    expect(parsePreferences({ voice: "yes" })).toEqual(base);
    expect(parsePreferences({ sessionMinutes: 20 })).toEqual({
      ...base,
      sessionMinutes: 20,
    });
    expect(parsePreferences({ sessionMinutes: 7 })).toEqual(base);
  });
});

describe("auth validation", () => {
  it("normalises email and enforces the password policy", () => {
    expect(
      loginSchema.parse({ email: " A@Example.COM ", password: "x" }).email,
    ).toBe("a@example.com");
    const base = { email: "a@example.com", confirm: "abcdefg1" };
    expect(
      registerSchema.safeParse({ ...base, password: "abcdefg1" }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({
        ...base,
        password: "abcdefgh",
        confirm: "abcdefgh",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: "abc12", confirm: "abc12" })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: "abcdefg2" }).success,
    ).toBe(false);
  });
});
