import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Email chưa đúng định dạng.").max(254));

/** Matches supabase/config.toml: ≥ 8 characters with letters and digits. */
export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
  .max(72, "Mật khẩu tối đa 72 ký tự.")
  .regex(/[A-Za-z]/, "Mật khẩu cần có chữ cái.")
  .regex(/\d/, "Mật khẩu cần có chữ số.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Hãy nhập mật khẩu.").max(72),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .max(60, "Tên tối đa 60 ký tự.")
      .optional()
      .transform((v) => v || undefined),
    email,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Mật khẩu nhập lại chưa khớp.",
  });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Mật khẩu nhập lại chưa khớp.",
  });
