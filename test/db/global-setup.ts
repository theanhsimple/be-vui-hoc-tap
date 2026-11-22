import { execFileSync } from "node:child_process";

import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    supabase: {
      url: string;
      anonKey: string;
      serviceKey: string;
      dbUrl: string;
    };
  }
}

/**
 * Reads the LOCAL stack's well-known development keys from `supabase status`.
 * Refuses to run against anything but localhost.
 */
export default function setup(project: TestProject) {
  let raw: string;
  try {
    raw = execFileSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error(
      "Local Supabase is not running. Start it with `pnpm db:start` (and `pnpm db:reset`).",
    );
  }
  const status = JSON.parse(raw.slice(raw.indexOf("{"))) as Record<
    string,
    string
  >;
  const url = status.API_URL ?? "";
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)) {
    throw new Error(`Refusing to run DB tests against non-local URL: ${url}`);
  }
  project.provide("supabase", {
    url,
    anonKey: status.ANON_KEY ?? "",
    serviceKey: status.SERVICE_ROLE_KEY ?? "",
    dbUrl: status.DB_URL ?? "",
  });
}
