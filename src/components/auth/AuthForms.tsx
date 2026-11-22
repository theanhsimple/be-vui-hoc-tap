"use client";

import { useActionState } from "react";

import { FormMessage, TextField } from "@/components/forms/FormBits";
import { LittleButton } from "@/components/ui/LittleButton";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "@/features/auth/actions";
import { IDLE } from "@/features/forms";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        state={state}
      />
      <TextField
        label="Mật khẩu"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        state={state}
      />
      <FormMessage state={state} />
      <LittleButton type="submit" size="lg" fullWidth loading={pending}>
        Đăng nhập
      </LittleButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUpAction, IDLE);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        label="Tên của bố mẹ (không bắt buộc)"
        name="displayName"
        autoComplete="name"
        maxLength={60}
        state={state}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        state={state}
      />
      <TextField
        label="Mật khẩu"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Ít nhất 8 ký tự, gồm cả chữ và số."
        required
        state={state}
      />
      <TextField
        label="Nhập lại mật khẩu"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        state={state}
      />
      <FormMessage state={state} />
      <LittleButton type="submit" size="lg" fullWidth loading={pending}>
        Tạo tài khoản
      </LittleButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    IDLE,
  );
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        state={state}
      />
      <FormMessage state={state} />
      <LittleButton type="submit" size="lg" fullWidth loading={pending}>
        Gửi liên kết đặt lại
      </LittleButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextField
        label="Mật khẩu mới"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Ít nhất 8 ký tự, gồm cả chữ và số."
        required
        state={state}
      />
      <TextField
        label="Nhập lại mật khẩu mới"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        state={state}
      />
      <FormMessage state={state} />
      <LittleButton type="submit" size="lg" fullWidth loading={pending}>
        Lưu mật khẩu mới
      </LittleButton>
    </form>
  );
}
