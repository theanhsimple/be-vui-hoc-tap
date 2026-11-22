import { describe, expect, it } from "vitest";

import { parseClientEnv } from "./env";
import { parseServerEnv } from "./env.server";

describe("parseClientEnv", () => {
  it("defaults the site URL and treats empty values as unset", () => {
    const env = parseClientEnv({
      NEXT_PUBLIC_SITE_URL: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    });
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeUndefined();
  });

  it("fails fast on malformed URLs", () => {
    expect(() =>
      parseClientEnv({ NEXT_PUBLIC_SUPABASE_URL: "not a url" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("parseServerEnv", () => {
  it("parses the design-system flag", () => {
    expect(
      parseServerEnv({ ENABLE_DESIGN_SYSTEM: "true" }).ENABLE_DESIGN_SYSTEM,
    ).toBe(true);
    expect(
      parseServerEnv({ ENABLE_DESIGN_SYSTEM: "" }).ENABLE_DESIGN_SYSTEM,
    ).toBe(false);
    expect(parseServerEnv({}).ENABLE_DESIGN_SYSTEM).toBe(false);
  });

  it("rejects unexpected flag values", () => {
    expect(() => parseServerEnv({ ENABLE_DESIGN_SYSTEM: "yes" })).toThrow();
  });
});
