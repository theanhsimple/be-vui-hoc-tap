import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";

import { clientEnv } from "@/lib/env";

import "./globals.css";
import { ServerRuntimeProvider } from "@/features/learning/server-runtime";

import { Providers } from "./providers";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: { default: "little — Little Explorer World", template: "%s · little" },
  description: "A little step. A big discovery. Học mà chơi cho bé 5–6 tuổi.",
  applicationName: "little",
  appleWebApp: { capable: true, title: "little", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d3ecff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${nunitoSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <ServerRuntimeProvider>{children}</ServerRuntimeProvider>
        </Providers>
      </body>
    </html>
  );
}
