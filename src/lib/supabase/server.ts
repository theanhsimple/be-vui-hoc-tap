import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { AUTH_COOKIE_OPTIONS, requireSupabaseConfig } from "./config";
import type { Database } from "./database.types";

export type DbClient = SupabaseClient<Database>;

/**
 * Supabase client acting AS THE SIGNED-IN USER (cookie session). Every query
 * is subject to RLS. Use in Server Components, Server Functions and Route
 * Handlers. In Server Components cookie writes are ignored (the proxy has
 * already refreshed the session for this request).
 */
export async function createSupabaseServerClient(): Promise<DbClient> {
  const { url, key } = requireSupabaseConfig();
  // Auth reads the clock (token expiry): mark this render as request-time.
  await connection();
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, { ...options, ...AUTH_COOKIE_OPTIONS });
          }
        } catch {
          // Called from a Server Component: cookies are read-only there.
        }
      },
    },
  });
}

/**
 * Anonymous client for PUBLISHED learning content only (RLS: status =
 * 'published'). Holds no session, so its results can be cached and shared.
 */
export function createSupabasePublicClient(): DbClient {
  const { url, key } = requireSupabaseConfig();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
