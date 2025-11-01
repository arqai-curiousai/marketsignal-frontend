// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;


// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Browser requests to /api/* are proxied to FastAPI at :8000
      { source: "/api/:path*", destination: "http://127.0.0.1:8000/api/v1/:path*" },
    ];
  },
};

export default nextConfig;
