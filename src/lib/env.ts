import { z } from "zod";

/** Treat empty strings from `.env` files as "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

/**
 * Public (browser-safe) environment. Every variable must be referenced
 * explicitly as `process.env.NAME` so Next.js can inline it at build time.
 *
 * Supabase variables are optional until Sprint 03, when they become required.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    (v) => (v === "" || v === undefined ? "http://localhost:3000" : v),
    z.url(),
  ),
  NEXT_PUBLIC_SUPABASE_URL: optional(z.url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optional(z.string().min(1)),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseClientEnv(
  source: Record<string, string | undefined>,
): ClientEnv {
  const result = clientEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid public environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const clientEnv: ClientEnv = parseClientEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
