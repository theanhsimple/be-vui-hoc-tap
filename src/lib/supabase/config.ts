import { clientEnv } from "@/lib/env";

export interface SupabaseConfig {
  url: string;
  key: string;
}

/** Public Supabase settings, or null when the backend is not configured. */
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export class BackendNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see docs/SUPABASE_SETUP.md).",
    );
    this.name = "BackendNotConfiguredError";
  }
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config) throw new BackendNotConfiguredError();
  return config;
}

/**
 * Auth cookies are httpOnly: the browser never runs a Supabase client, so no
 * script can read the session tokens. Sessions are refreshed by src/proxy.ts.
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;
