import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { AvatarKey } from "@/components/ui/LittleAvatar";
import { requireUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { type ChildPreferences, parsePreferences, uuidSchema } from "./schemas";

/**
 * Family & child reads. Every query runs as the signed-in guardian, so RLS
 * limits results to their own family; ids from cookies or URLs are only
 * ever used as filters, never trusted as authorization.
 */

export interface FamilyInfo {
  id: string;
  displayName: string;
  role: "owner" | "guardian";
}

export interface ChildProfile {
  id: string;
  nickname: string;
  avatar: AvatarKey;
  birthYear: number | null;
  status: "active" | "archived";
  preferences: ChildPreferences;
}

export const SELECTED_CHILD_COOKIE = "little_child";
export const SELECTED_CHILD_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
} as const;

export const getMyFamily = cache(async (): Promise<FamilyInfo | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("role, families(id, display_name)")
    .eq("status", "active")
    .order("role", { ascending: true }) // owner first
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`family lookup failed: ${error.code}`);
  if (!data?.families) return null;
  return {
    id: data.families.id,
    displayName: data.families.display_name,
    role: data.role,
  };
});

/** Parent area gate: signed in AND has a family (else onboarding). */
export async function requireFamily(nextPath: string) {
  const user = await requireUser(nextPath);
  const family = await getMyFamily();
  if (!family) redirect("/parent/onboarding");
  return { user, family };
}

const toProfile = (row: {
  id: string;
  nickname: string;
  avatar_key: string;
  birth_year: number | null;
  status: "active" | "archived";
  preferences: unknown;
}): ChildProfile => ({
  id: row.id,
  nickname: row.nickname,
  avatar: row.avatar_key as AvatarKey,
  birthYear: row.birth_year,
  status: row.status,
  preferences: parsePreferences(row.preferences),
});

export const listChildren = cache(
  async (opts: { includeArchived?: boolean } = {}): Promise<ChildProfile[]> => {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("children")
      .select("id, nickname, avatar_key, birth_year, status, preferences")
      .order("created_at", { ascending: true });
    if (!opts.includeArchived) query = query.eq("status", "active");
    const { data, error } = await query;
    if (error) throw new Error(`children lookup failed: ${error.code}`);
    return (data ?? []).map(toProfile);
  },
);

/** One child of the caller's family (RLS), or null — also for foreign ids. */
export async function getChild(childId: string): Promise<ChildProfile | null> {
  if (!uuidSchema.safeParse(childId).success) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("children")
    .select("id, nickname, avatar_key, birth_year, status, preferences")
    .eq("id", childId)
    .maybeSingle();
  if (error) throw new Error(`child lookup failed: ${error.code}`);
  return data ? toProfile(data) : null;
}

/**
 * The child chosen on profile selection. The cookie only names a child; it is
 * re-validated against the guardian's family on every request.
 */
export const getSelectedChild = cache(
  async (): Promise<ChildProfile | null> => {
    const id = (await cookies()).get(SELECTED_CHILD_COOKIE)?.value;
    if (!id) return null;
    const child = await getChild(id);
    return child?.status === "active" ? child : null;
  },
);

export function ageLabel(birthYear: number | null, now = new Date()): string {
  if (!birthYear) return "";
  const age = now.getUTCFullYear() - birthYear;
  return age > 0 ? `${age} tuổi` : "";
}

export interface FamilyMember {
  userId: string;
  displayName: string | null;
  role: "owner" | "guardian";
  since: string;
  isMe: boolean;
}

/** Active members of the caller's family (RLS: own family only). */
export async function listMembers(familyId: string): Promise<FamilyMember[]> {
  const user = await requireUser("/parent/settings");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("family_members")
    .select(
      "user_id, role, created_at, profiles!family_members_user_id_fkey(display_name)",
    )
    .eq("family_id", familyId)
    .eq("status", "active")
    .order("created_at");
  if (error) throw new Error(`members lookup failed: ${error.code}`);
  return (data ?? []).map((m) => ({
    userId: m.user_id,
    displayName: m.profiles?.display_name ?? null,
    role: m.role,
    since: m.created_at,
    isMe: m.user_id === user.id,
  }));
}

export interface FamilyInvite {
  id: string;
  createdAt: string;
  expiresAt: string;
}

/** Open (unused, unrevoked, unexpired) invitations. Owner only (RLS). */
export async function listOpenInvites(
  familyId: string,
): Promise<FamilyInvite[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("family_invitations")
    .select("id, created_at, expires_at")
    .eq("family_id", familyId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(`invites lookup failed: ${error.code}`);
  return (data ?? []).map((i) => ({
    id: i.id,
    createdAt: i.created_at,
    expiresAt: i.expires_at,
  }));
}
