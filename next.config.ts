// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const API_BASE = isDev
  ? "http://127.0.0.1:8000"
  : "https://backend.legalaid.arqai.tech";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Proxy browser requests to your FastAPI backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/v1/:path*`,
      },
    ];
  },

  // Real HTTP security headers (do NOT try to set these via <meta>)
  async headers() {
    return [
      {
        // Global security headers for all pages/assets
        source: "/:path*",
        headers: [
          // Prevent your app from being iframed by other sites
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          // Legacy equivalent (browsers ignore <meta http-equiv="X-Frame-Options">)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },

          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },

          // Strong transport (enable after you confirm HTTPS everywhere)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
      {
        // API responses shouldn’t be cached by browsers/proxies
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
