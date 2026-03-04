/**
 * Server-side API proxy for stocks endpoint.
 * 
 * This route handler proxies requests to the backend API,
 * keeping the API key secure on the server side.
 * 
 * Security benefits:
 * - API key is never exposed to client-side JavaScript
 * - Can add additional server-side validation
 * - Easier to implement caching at the edge
 */
import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api/backendUrl';

// API key stored securely on server (not in NEXT_PUBLIC_*)
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Build backend URL with query params
    const backendUrl = new URL(`${BACKEND_URL}/stocks`);
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
