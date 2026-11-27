import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";

import { DeviceRuntimeProvider } from "@/device/runtime";

import "./globals.css";
import { Providers } from "./providers";

/**
 * DEVICE EDITION root layout (static hosting, e.g. GitHub Pages). Built only
 * with LITTLE_EDITION=device (pageExtensions "device.tsx"); no server code.
 */
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: { default: "little — Bé vui học", template: "%s · little" },
  description: "A little step. A big discovery. Học mà chơi cho bé 5–6 tuổi.",
  applicationName: "little",
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: [
      {
        url: `${base}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [{ url: `${base}/icons/apple-touch-icon.png`, sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "little", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d3ecff",
};

export default function DeviceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${nunitoSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <DeviceRuntimeProvider>{children}</DeviceRuntimeProvider>
        </Providers>
      </body>
    </html>
  );
}
