import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Little Explorer World", template: "%s · little" },
  // Child-facing area: never indexed.
  robots: { index: false, follow: false },
};

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return children;
}
