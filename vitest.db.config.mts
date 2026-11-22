import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Database security & learning-engine tests. They run against a REAL local
 * Supabase stack (`pnpm db:start && pnpm db:reset`) through the public API
 * with signed-in users — never with the service-role key for assertions.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./test/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["test/db/**/*.test.ts"],
    globalSetup: ["./test/db/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
