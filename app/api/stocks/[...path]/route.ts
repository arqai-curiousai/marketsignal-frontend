/**
 * Catch-all server-side API proxy for /api/stocks/* sub-paths.
 * 
 * Proxies requests like:
 *   /api/stocks/exchanges → backend /api/stocks/exchanges
 *   /api/stocks/AAPL/quote → backend /api/stocks/AAPL/quote
 *   /api/stocks/AAPL/signal → backend /api/stocks/AAPL/signal
 *   /api/stocks/AAPL/ohlcv → backend /api/stocks/AAPL/ohlcv
 * 
 * Security: API key is injected server-side, never exposed to the browser.
 */
import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api/backendUrl';

const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const subPath = params.path.join('/');
    const { searchParams } = new URL(request.url);

    // Build backend URL
    const backendUrl = new URL(`${BACKEND_URL}/stocks/${subPath}`);
    searchParams.forEach((value, key) => {
        backendUrl.searchParams.append(key, value);
    });

    try {
        const response = await fetch(backendUrl.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: error.detail || 'Backend error' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch from backend' },
            { status: 502 }
        );
    }
}
