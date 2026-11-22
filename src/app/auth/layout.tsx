import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Tài khoản", template: "%s · little" },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return children;
}
