import { z } from "zod";

import { AVATAR_KEYS } from "@/components/ui/LittleAvatar";

/** Shared validation for family & child forms (client hints + server truth). */

export const CONSENT_VERSION = "2026-11";

const trimmed = (min: number, max: number, message: string) =>
  z
    .string()
    .transform((s) => s.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(min, message).max(max, message));

export const familySchema = z.object({
  displayName: trimmed(1, 60, "Tên gia đình cần từ 1 đến 60 ký tự."),
  consent: z.literal("on", {
    error: "Bố mẹ cần đồng ý để tiếp tục.",
  }),
});

export const childPreferencesSchema = z.object({
  /** Spoken instructions and feedback. */
  voice: z.boolean().default(true),
  /** Short sound effects. */
  sounds: z.boolean().default(true),
});
export type ChildPreferences = z.infer<typeof childPreferencesSchema>;

export function parsePreferences(raw: unknown): ChildPreferences {
  const parsed = childPreferencesSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : { voice: true, sounds: true };
}

const CURRENT_YEAR = new Date().getUTCFullYear();

export const childSchema = z.object({
  nickname: trimmed(1, 20, "Tên gọi của bé cần từ 1 đến 20 ký tự."),
  avatar: z.enum(AVATAR_KEYS, { error: "Hãy chọn một hình đại diện." }),
  birthYear: z
    .union([z.literal(""), z.coerce.number().int()])
    .transform((v) => (v === "" ? null : v))
    .refine(
      (v) => v === null || (v >= CURRENT_YEAR - 12 && v <= CURRENT_YEAR),
      "Năm sinh chưa hợp lệ.",
    ),
  voice: z.literal("on").optional().transform(Boolean),
  sounds: z.literal("on").optional().transform(Boolean),
});
export type ChildInput = z.infer<typeof childSchema>;

export const uuidSchema = z.uuid();
