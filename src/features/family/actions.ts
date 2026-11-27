"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/features/auth/session";
import { echo, type FormState, fieldErrors, formError } from "@/features/forms";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  getChild,
  getMyFamily,
  SELECTED_CHILD_COOKIE,
  SELECTED_CHILD_COOKIE_OPTIONS,
} from "./queries";
import {
  CONSENT_VERSION,
  childSchema,
  familySchema,
  uuidSchema,
} from "./schemas";

/**
 * Family & child Server Functions. They are public endpoints: every input is
 * validated, the user is re-checked, the family id is NEVER taken from the
 * client, and writes go through RLS or checked RPCs.
 */

function dbMessage(message: string | undefined): string {
  switch (message) {
    case "family_exists":
      return "Tài khoản này đã có gia đình.";
    case "child_limit":
      return "Mỗi gia đình có tối đa 6 hồ sơ bé.";
    case "invalid_child":
    case "invalid_name":
      return "Thông tin chưa hợp lệ. Bố mẹ kiểm tra lại nhé.";
    case "consent_required":
      return "Bố mẹ cần đồng ý để tiếp tục.";
    default:
      return "Chưa lưu được. Vui lòng thử lại.";
  }
}

export async function createFamilyAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser("/parent/onboarding");
  const parsed = familySchema.safeParse({
    displayName: form.get("displayName") ?? "",
    consent: form.get("consent") ?? undefined,
  });
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: fieldErrors(parsed.error),
      values: echo(form, ["displayName"]),
    };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_family", {
    p_display_name: parsed.data.displayName,
    p_consent_version: CONSENT_VERSION,
  });
  if (error && error.message !== "family_exists")
    return formError(dbMessage(error.message), echo(form, ["displayName"]));
  redirect("/parent/children/new");
}

const CHILD_FIELDS = [
  "nickname",
  "avatar",
  "birthYear",
  "voice",
  "sounds",
  "sessionMinutes",
];

function childFields(form: FormData) {
  return childSchema.safeParse({
    nickname: form.get("nickname") ?? "",
    avatar: form.get("avatar") ?? "",
    birthYear: form.get("birthYear") ?? "",
    voice: form.get("voice") ?? undefined,
    sounds: form.get("sounds") ?? undefined,
    sessionMinutes: form.get("sessionMinutes") ?? "",
  });
}

export async function createChildAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser("/parent/children/new");
  const family = await getMyFamily();
  if (!family) redirect("/parent/onboarding");
  const parsed = childFields(form);
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: fieldErrors(parsed.error),
      values: echo(form, CHILD_FIELDS),
    };
  const { nickname, avatar, birthYear, voice, sounds, sessionMinutes } =
    parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data: newId, error } = await supabase.rpc("create_child", {
    p_family_id: family.id,
    p_nickname: nickname,
    p_avatar_key: avatar,
    // Generated RPC types cannot express nullable args; null is valid here.
    p_birth_year: birthYear as number,
    p_preferences: { voice, sounds, sessionMinutes } satisfies Json,
  });
  if (error)
    return formError(dbMessage(error.message), echo(form, CHILD_FIELDS));
  // First child of a new family: offer the placement activity next.
  if (form.get("onboarding") === "1" && newId)
    redirect(`/parent/children/${newId}/discover?welcome=1`);
  redirect("/parent?saved=child");
}

export async function updateChildAction(
  childId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser("/parent");
  if (!uuidSchema.safeParse(childId).success)
    return formError("Không tìm thấy hồ sơ.");
  const parsed = childFields(form);
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: fieldErrors(parsed.error),
      values: echo(form, CHILD_FIELDS),
    };
  const { nickname, avatar, birthYear, voice, sounds, sessionMinutes } =
    parsed.data;
  const supabase = await createSupabaseServerClient();
  // RLS limits the update to this family's active children; family_id and
  // status are not updatable columns.
  const { data, error } = await supabase
    .from("children")
    .update({
      nickname,
      avatar_key: avatar,
      birth_year: birthYear,
      preferences: { voice, sounds, sessionMinutes },
    })
    .eq("id", childId)
    .select("id");
  if (error) return formError(dbMessage(error.message));
  if (!data?.length) return formError("Không tìm thấy hồ sơ.");
  redirect(`/parent/children/${childId}?saved=updated`);
}

export async function archiveChildAction(
  childId: string,
  ...[]: [prev: FormState, form: FormData]
): Promise<FormState> {
  await requireUser("/parent");
  if (!uuidSchema.safeParse(childId).success)
    return formError("Không tìm thấy hồ sơ.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_child", {
    p_child_id: childId,
  });
  if (error) return formError("Chưa lưu trữ được hồ sơ. Vui lòng thử lại.");
  const store = await cookies();
  if (store.get(SELECTED_CHILD_COOKIE)?.value === childId)
    store.delete(SELECTED_CHILD_COOKIE);
  redirect("/parent?saved=archived");
}

/** Profile selection. The child must be an ACTIVE child of the caller's family. */
export async function selectChildAction(
  childId: string,
): Promise<{ ok: false; message: string } | never> {
  await requireUser("/student/profiles");
  const child = await getChild(childId);
  if (!child || child.status !== "active")
    return { ok: false, message: "Không tìm thấy hồ sơ của bé." };
  (await cookies()).set(
    SELECTED_CHILD_COOKIE,
    child.id,
    SELECTED_CHILD_COOKIE_OPTIONS,
  );
  redirect("/student/home");
}

export async function leaveStudentAction(): Promise<never> {
  (await cookies()).delete(SELECTED_CHILD_COOKIE);
  redirect("/student/profiles");
}

export async function restoreChildAction(
  childId: string,
  ...[]: [prev: FormState, form: FormData]
): Promise<FormState> {
  await requireUser("/parent");
  if (!uuidSchema.safeParse(childId).success)
    return formError("Không tìm thấy hồ sơ.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("restore_child", {
    p_child_id: childId,
  });
  if (error) return formError(dbMessage(error.message));
  redirect(`/parent/children/${childId}?saved=restored`);
}

/** Permanent deletion of an ARCHIVED child; the nickname is typed to confirm. */
export async function deleteChildAction(
  childId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser("/parent");
  if (!uuidSchema.safeParse(childId).success)
    return formError("Không tìm thấy hồ sơ.");
  const confirm = String(form.get("confirm") ?? "").slice(0, 40);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_child", {
    p_child_id: childId,
    p_confirm_nickname: confirm,
  });
  if (error)
    return formError(
      error.message === "confirmation_mismatch"
        ? "Tên gọi chưa khớp. Hãy gõ đúng tên gọi của bé để xác nhận."
        : error.message === "forbidden"
          ? "Chỉ chủ gia đình mới xoá được hồ sơ."
          : dbMessage(error.message),
      { confirm },
    );
  redirect("/parent?saved=deleted");
}
