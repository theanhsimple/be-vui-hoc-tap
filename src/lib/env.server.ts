import "server-only";

import { z } from "zod";

/**
 * Server-only environment. Importing this module from a Client Component
 * fails the build, which keeps secrets out of the browser bundle.
 *
 * The web app needs NO service-role key: every database call runs as the
 * signed-in guardian under RLS / checked RPCs (docs/SECURITY_AND_RLS.md).
 */
export const serverEnvSchema = z.object({
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
    ENABLE_DESIGN_SYSTEM: process.env.ENABLE_DESIGN_SYSTEM,
  });
}
