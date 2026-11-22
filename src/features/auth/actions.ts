"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SELECTED_CHILD_COOKIE } from "@/features/family/queries";
import { echo, type FormState, fieldErrors, formError } from "@/features/forms";
import { clientEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { authErrorMessage } from "./messages";
import { safeNextPath } from "./redirect";
import {
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
} from "./schemas";
import { getSessionUser } from "./session";

/**
 * Auth Server Functions. Sessions live in httpOnly cookies written by
 * @supabase/ssr; nothing is stored in browser storage. Responses never reveal
 * whether an email has an account (sign-up and reset look the same either way).
 */

const callbackUrl = (next: string) =>
  `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;

export async function signInAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: form.get("email") ?? "",
    password: form.get("password") ?? "",
  });
  const values = echo(form, ["email"]);
  if (!parsed.success)
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return formError(authErrorMessage(error.code), values);
  redirect(safeNextPath(form.get("next")));
}

export async function signUpAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    displayName: form.get("displayName") ?? undefined,
    email: form.get("email") ?? "",
    password: form.get("password") ?? "",
    confirm: form.get("confirm") ?? "",
  });
  const values = echo(form, ["displayName", "email"]);
  if (!parsed.success)
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const { email, password, displayName } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl("/parent/onboarding"),
      data: displayName ? { display_name: displayName } : undefined,
    },
  });
  if (error) {
    // Don't confirm that an address is registered.
    if (error.code === "user_already_exists" || error.code === "email_exists")
      return checkEmail();
    return formError(authErrorMessage(error.code), values);
  }
  // Email confirmation disabled (some dev setups): already signed in.
  if (data.session) redirect("/parent/onboarding");
  return checkEmail();
}

function checkEmail(): FormState {
  return {
    status: "success",
    message:
      "Chúng tôi đã gửi thư xác nhận. Bố mẹ hãy mở email và bấm vào liên kết để kích hoạt tài khoản.",
  };
}

export async function requestPasswordResetAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = forgotSchema.safeParse({ email: form.get("email") ?? "" });
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: fieldErrors(parsed.error),
      values: echo(form, ["email"]),
    };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: callbackUrl("/auth/reset-password") },
  );
  if (error?.code?.startsWith("over_"))
    return formError(authErrorMessage(error.code));
  return {
    status: "success",
    message:
      "Nếu email này có tài khoản, bố mẹ sẽ nhận được thư hướng dẫn đặt lại mật khẩu trong vài phút.",
  };
}

export async function updatePasswordAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  if (!(await getSessionUser()))
    return formError(
      "Liên kết đặt lại mật khẩu đã hết hạn. Bố mẹ hãy yêu cầu liên kết mới.",
    );
  const parsed = resetSchema.safeParse({
    password: form.get("password") ?? "",
    confirm: form.get("confirm") ?? "",
  });
  if (!parsed.success)
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return formError(authErrorMessage(error.code));
  redirect("/parent?saved=password");
}

export async function signOutAction(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  (await cookies()).delete(SELECTED_CHILD_COOKIE);
  redirect("/auth/login?signedOut=1");
}
