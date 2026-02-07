import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend.arthsarthi.arqai.tech/api/v1';

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
