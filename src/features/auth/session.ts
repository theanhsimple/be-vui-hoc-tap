import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string | null;
}

/**
 * The signed-in user for this request, or null. `getClaims()` verifies the
 * JWT (signature + expiry) — never trust `getSession()` on the server.
 * Deduplicated per request with React `cache`.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
});

/** Data Access Layer gate: redirects to login (with a safe `next`) when signed out. */
export async function requireUser(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}
