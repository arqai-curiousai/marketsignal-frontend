const nextConfig = {
    output: 'standalone',
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
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "Content-Security-Policy", value: "frame-ancestors 'none';" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
        ];
    },
    async rewrites() {
        // When running locally in dev mode, we proxy /api requests to the Python backend
        // Use API_ORIGIN if available (usually the domain root), otherwise API_URL or localhost
        const rawUrl = process.env.NEXT_PUBLIC_API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Ensure we don't end up with double /api if the env var includes it
        const targetUrl = rawUrl.replace(/\/api\/?$/, '');

        return [
            {
                source: '/api/:path*',
                destination: `${targetUrl}/api/:path*`,
            },
            {
                source: '/ws/:path*',
                destination: `${targetUrl}/ws/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
