import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/AuthForms";
import { LittleStatePanel } from "@/components/ui/LittleStatePanel";
import { safeNextPath } from "@/features/auth/redirect";
import { getSessionUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage(props: PageProps<"/auth/login">) {
  return (
    <AuthCard
      title="Đăng nhập"
      description="Dành cho bố mẹ và người giám hộ."
      footer={
        <>
          <AuthLink href="/auth/forgot-password">Quên mật khẩu?</AuthLink>
          <p className="text-ink-muted">
            Chưa có tài khoản?{" "}
            <AuthLink href="/auth/register">Đăng ký</AuthLink>
          </p>
        </>
      }
    >
      <Suspense fallback={<LittleStatePanel kind="loading" />}>
        <Login {...props} />
      </Suspense>
    </AuthCard>
  );
}

async function Login({ searchParams }: PageProps<"/auth/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  if (await getSessionUser()) redirect(safeNextPath(next));
  return (
    <>
      {params.link === "invalid" && (
        <p
          role="alert"
          className="rounded-md bg-warning-50 p-3 text-body font-semibold text-warning-strong"
        >
          Liên kết đã hết hạn hoặc không hợp lệ. Nếu bố mẹ vừa xác nhận email,
          hãy đăng nhập bên dưới.
        </p>
      )}
      {params.deleted && (
        <p role="status" className="rounded-md bg-surface-muted p-3 text-body">
          Tài khoản và dữ liệu đã được xoá.
        </p>
      )}
      {params.signedOut && (
        <p role="status" className="rounded-md bg-surface-muted p-3 text-body">
          Bố mẹ đã đăng xuất.
        </p>
      )}
      <LoginForm next={next} />
    </>
  );
}
