import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/lib/api/backendUrl';

const API_BASE = BACKEND_URL;

/**
 * GET /api/watchlist/count - Get watchlist count
 */
export async function GET(_request: NextRequest) {
    try {
        const cookieStore = cookies();
        const accessToken = cookieStore.get('access_token');

        if (!accessToken) {
            return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
        }

        const response = await fetch(`${API_BASE}/watchlist/count`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${accessToken.value}`,
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Watchlist count error:', error);
        return NextResponse.json({ detail: 'Failed to get count' }, { status: 500 });
    }
}
