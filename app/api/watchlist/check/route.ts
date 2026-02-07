import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend.arthsarthi.arqai.tech/api/v1';

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
