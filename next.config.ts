// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const API_BASE = isDev
  ? "http://127.0.0.1:8000"
  : "https://backend.arthsarthi.arqai.tech";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Proxy browser requests to your FastAPI backend
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: `${API_BASE}/api/v1/:path*`,
  //     },
  //   ];
  // },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`, // forwards to backend
      },
    ];
  },

  // next.config.ts (trimmed)
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        // REMOVE CSP, X-Frame-Options, HSTS from here
        { key: "X-DNS-Prefetch-Control", value: "off" },
      ],
    },
    {
      source: "/api/:path*",
      headers: [{ key: "Cache-Control", value: "no-store" }],
    },
  ];
}

};

export default nextConfig;
