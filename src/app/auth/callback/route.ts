import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { safeNextPath } from "@/features/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "recovery",
  "email",
  "email_change",
  "invite",
  "magiclink",
]);

/**
 * Landing point for email links (sign-up confirmation, password recovery).
 * Exchanges the one-time code for a session cookie, then redirects to a
 * validated same-site path.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNextPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = await createSupabaseServerClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type && OTP_TYPES.has(type)) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash }))
      .error;
  }

  const target = new URL(ok ? next : "/auth/login?link=invalid", url.origin);
  return NextResponse.redirect(target);
}
