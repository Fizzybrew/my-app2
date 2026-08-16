import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const basePath = process.env.IS_DEMO === "1" ? "/demo" : "";

const nextConfig: NextConfig = {
  ...(basePath
    ? {
        assetPrefix: "/demo-assets",
        basePath,
        redirects: async () => [
          {
            basePath: false,
            destination: basePath,
            permanent: false,
            source: "/",
          },
        ],
      }
    : {}),
  allowedDevOrigins: ["192.168.3.74"],
  // Cache Components is intentionally disabled for this chat shell. The
  // application uses request-bound cookies/session state in the shared layout
  // so the initial sidebar and model state can be rendered correctly on the
  // server without introducing Suspense fallbacks or hydration jumps.
  cacheComponents: false,
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  experimental: {
    appNewScrollHandler: true,
    inlineCss: true,
    prefetchInlining: true,
    turbopackFileSystemCacheForDev: true,
  },
  async headers() {
    return [
      {
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy-Report-Only",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;",
          },
        ],
        source: "/(.*)",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        hostname: "*.public.blob.vercel-storage.com",
        protocol: "https",
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
    incomingRequests: false,
  },
  poweredByHeader: false,
  reactCompiler: false,
};

export default withBotId(nextConfig);
