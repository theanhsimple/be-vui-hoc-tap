import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Phụ huynh", template: "%s · little" },
  robots: { index: false, follow: false },
};

export default function ParentLayout({ children }: LayoutProps<"/parent">) {
  return children;
}
