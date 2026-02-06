const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    experimental: {
        serverComponentsExternalPackages: ['mongodb'],
    },
    webpack(config, { dev }) {
        if (dev) {
            config.watchOptions = {
                poll: 2000,
                aggregateTimeout: 300,
                ignored: ['**/node_modules'],
            };
        }
        return config;
    },
    onDemandEntries: {
        maxInactiveAge: 10000,
        pagesBufferLength: 2,
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Frame-Options", value: "ALLOWALL" },
                    { key: "Content-Security-Policy", value: "frame-ancestors *;" },
                    { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "*" },
                ],
            },
        ];
    },
    async rewrites() {
        // When running locally in dev mode, we proxy /api requests to the Python backend
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        return [
            {
                source: '/api/:path*',
                destination: `${API_URL}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
