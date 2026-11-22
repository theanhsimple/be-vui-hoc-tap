import type { Metadata } from "next";

import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Tạo tài khoản phụ huynh"
      description="Tài khoản thuộc về bố mẹ hoặc người giám hộ. Bé không cần email hay mật khẩu."
      footer={
        <p className="text-ink-muted">
          Đã có tài khoản? <AuthLink href="/auth/login">Đăng nhập</AuthLink>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
