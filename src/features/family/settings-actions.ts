"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/features/auth/session";
import { echo, type FormState, fieldErrors, formError } from "@/features/forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getMyFamily, SELECTED_CHILD_COOKIE } from "./queries";
import { CONSENT_VERSION, uuidSchema } from "./schemas";

/**
 * Settings Server Functions (family name, invitations, membership, deletion).
 * Roles are enforced by the database RPCs/RLS; these only validate input and
 * translate stable error codes into parent-friendly Vietnamese.
 */

const MESSAGES: Record<string, string> = {
  forbidden: "Chỉ chủ gia đình mới làm được việc này.",
  invite_limit: "Đã có 3 mã mời đang chờ. Hãy huỷ bớt một mã trước.",
  invite_invalid:
    "Mã mời không đúng, đã được dùng hoặc đã hết hạn. Bố mẹ hãy xin mã mới.",
  already_in_family: "Tài khoản này đã thuộc một gia đình.",
  consent_required: "Bố mẹ cần đồng ý để tiếp tục.",
  confirmation_mismatch: "Nội dung xác nhận chưa khớp. Hãy gõ lại chính xác.",
  owner_cannot_leave: "Chủ gia đình không thể rời gia đình.",
  cannot_remove_owner: "Không thể xoá chủ gia đình.",
};
const msg = (code: string | undefined) =>
  (code && MESSAGES[code]) || "Chưa thực hiện được. Vui lòng thử lại.";

const familyNameSchema = z.object({
  displayName: z
    .string()
    .transform((s) => s.trim().replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(1, "Tên gia đình cần từ 1 đến 60 ký tự.")
        .max(60, "Tên gia đình cần từ 1 đến 60 ký tự."),
    ),
});

export async function updateFamilyNameAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser("/parent/settings");
  const family = await getMyFamily();
  if (!family) redirect("/parent/onboarding");
  const parsed = familyNameSchema.safeParse({
    displayName: form.get("displayName") ?? "",
  });
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: fieldErrors(parsed.error),
      values: echo(form, ["displayName"]),
    };
  const supabase = await createSupabaseServerClient();
  // RLS: only the owner may update; a guardian's update matches no row.
  const { data, error } = await supabase
    .from("families")
    .update({ display_name: parsed.data.displayName })
    .eq("id", family.id)
    .select("id");
  if (error || !data?.length)
    return formError(
      msg(error ? undefined : "forbidden"),
      echo(form, ["displayName"]),
    );
  return {
    status: "success",
    message: "Đã lưu tên gia đình.",
    values: { displayName: parsed.data.displayName },
  };
}

/** Invite state carries the one-time code to show (never stored in plain). */
export interface InviteState extends FormState {
  code?: string;
  expiresAt?: string;
}

export async function createInviteAction(
  ...[]: [prev: InviteState, form: FormData]
): Promise<InviteState> {
  await requireUser("/parent/settings");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_family_invite");
  if (error) return { status: "error", message: msg(error.message) };
  const r = z.object({ code: z.string(), expiresAt: z.string() }).parse(data);
  return { status: "success", code: r.code, expiresAt: r.expiresAt };
}

export async function revokeInviteAction(
  inviteId: string,
  ...[]: [prev: FormState, form: FormData]
): Promise<FormState> {
  await requireUser("/parent/settings");
  if (!uuidSchema.safeParse(inviteId).success) return formError(msg(undefined));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_family_invite", {
    p_invite_id: inviteId,
  });
  if (error) return formError(msg(error.message));
  redirect("/parent/settings?saved=invite-revoked");
}

export async function removeMemberAction(
  userId: string,
  ...[]: [prev: FormState, form: FormData]
): Promise<FormState> {
  await requireUser("/parent/settings");
  if (!uuidSchema.safeParse(userId).success) return formError(msg(undefined));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_family_member", {
    p_user_id: userId,
  });
  if (error) return formError(msg(error.message));
  redirect("/parent/settings?saved=member-removed");
}

export async function leaveFamilyAction(
  ...[]: [prev: FormState, form: FormData]
): Promise<FormState> {
  await requireUser("/parent/settings");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("leave_family");
  if (error) return formError(msg(error.message));
  (await cookies()).delete(SELECTED_CHILD_COOKIE);
  redirect("/parent/onboarding");
}

const joinSchema = z.object({
  code: z
    .string()
    .transform((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .pipe(z.string().length(10, "Mã mời gồm 10 chữ và số, ví dụ ABCDE-23456.")),
  consent: z.literal("on", { error: "Bố mẹ cần đồng ý để tiếp tục." }),
});

/** Onboarding alternative: join an existing family with an invitation code. */
export async function joinFamilyAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser("/parent/onboarding");
  const parsed = joinSchema.safeParse({
    code: form.get("code") ?? "",
    consent: form.get("consent") ?? undefined,
  });
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: fieldErrors(parsed.error),
      values: echo(form, ["code"]),
    };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_family_invite", {
    p_code: parsed.data.code,
    p_consent_version: CONSENT_VERSION,
  });
  if (error) return formError(msg(error.message), echo(form, ["code"]));
  redirect("/parent?saved=joined");
}

const confirmOf = (form: FormData) =>
  String(form.get("confirm") ?? "").slice(0, 80);

/** Owner: deletes the family and every child's data. The account stays. */
export async function deleteFamilyAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser("/parent/settings");
  const confirm = confirmOf(form);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_family", {
    p_confirm_name: confirm,
  });
  if (error) return formError(msg(error.message), { confirm });
  (await cookies()).delete(SELECTED_CHILD_COOKIE);
  redirect("/parent/onboarding?deleted=family");
}

/** Deletes the account (and, for an owner, the family), then signs out. */
export async function deleteAccountAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser("/parent/settings");
  const confirm = confirmOf(form);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_my_account", {
    p_confirm: confirm,
  });
  if (error) return formError(msg(error.message), { confirm });
  // The user no longer exists: drop the local session cookies.
  await supabase.auth.signOut({ scope: "local" });
  (await cookies()).delete(SELECTED_CHILD_COOKIE);
  redirect("/auth/login?deleted=1");
}
