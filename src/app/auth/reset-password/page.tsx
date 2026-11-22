import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { getSessionUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

/** Reached from the recovery email (via /auth/callback, which signs the user in). */
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Đặt mật khẩu mới"
      footer={<AuthLink href="/auth/login">Quay lại đăng nhập</AuthLink>}
    >
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <Reset />
      </Suspense>
    </AuthCard>
  );
}

async function Reset() {
  if (!(await getSessionUser())) {
    return (
      <p
        role="alert"
        className="rounded-md bg-warning-50 p-3 text-body font-semibold text-warning-strong"
      >
        Liên kết đặt lại mật khẩu đã hết hạn. Bố mẹ hãy{" "}
        <AuthLink href="/auth/forgot-password">yêu cầu liên kết mới</AuthLink>.
      </p>
    );
  }
  return <ResetPasswordForm />;
}
