import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/lib/api/backendUrl';

const API_BASE = BACKEND_URL;

/**
 * GET /api/watchlist/check - Check if stock is in watchlist
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const accessToken = cookieStore.get('access_token');

        if (!accessToken) {
            return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const ticker = searchParams.get('ticker');
        const exchange = searchParams.get('exchange');

        if (!ticker || !exchange) {
            return NextResponse.json({ detail: 'Missing ticker or exchange' }, { status: 400 });
        }

        const response = await fetch(
            `${API_BASE}/watchlist/check?ticker=${ticker}&exchange=${exchange}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `access_token=${accessToken.value}`,
                },
            }
        );

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Watchlist check error:', error);
        return NextResponse.json({ detail: 'Failed to check watchlist' }, { status: 500 });
    }
}
