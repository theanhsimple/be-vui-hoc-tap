import type { NextConfig } from "next";

/**
 * Two editions from one codebase (DECISIONS D-056):
 *  - server (default): Next.js server + Supabase.
 *  - device (LITTLE_EDITION=device): a static site for GitHub Pages; only
 *    `*.device.tsx` route files are used, everything runs on the device.
 */
const device = process.env.LITTLE_EDITION === "device";

const turbopack: NextConfig["turbopack"] = {
  rules: {
    "*.css": {
      loaders: ["@tailwindcss/turbopack"],
      as: "*.css",
    },
  },
};

const nextConfig: NextConfig = device
  ? {
      output: "export",
      pageExtensions: ["device.tsx", "device.ts"],
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
      trailingSlash: true,
      images: { unoptimized: true },
      distDir: "out", // static export lands here
      // Route types are generated per edition, so Next's built-in check would
      // reject the server-edition files. `pnpm typecheck` checks ALL files
      // (both editions) and runs in CI before this build.
      typescript: { ignoreBuildErrors: true },
      turbopack,
    }
  : {
      cacheComponents: true,
      partialPrefetching: true,
      turbopack,
    };

export default nextConfig;
