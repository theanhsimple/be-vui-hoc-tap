import type { Metadata } from "next";

import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Quên mật khẩu"
      description="Nhập email của tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu."
      footer={<AuthLink href="/auth/login">Quay lại đăng nhập</AuthLink>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
