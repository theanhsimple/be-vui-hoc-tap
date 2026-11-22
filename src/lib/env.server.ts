import "server-only";

import { z } from "zod";

/**
 * Server-only environment. Importing this module from a Client Component
 * fails the build, which keeps secrets out of the browser bundle.
 */
export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(1).optional(),
  ),
  ENABLE_DESIGN_SYSTEM: z
    .enum(["true", "false", ""])
    .optional()
    .transform((v) => v === "true"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid server environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export function getServerEnv(): ServerEnv {
  return parseServerEnv({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENABLE_DESIGN_SYSTEM: process.env.ENABLE_DESIGN_SYSTEM,
  });
}
