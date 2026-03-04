import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/lib/api/backendUrl';

const API_BASE = BACKEND_URL;

/**
 * GET /api/watchlist - Get user's watchlist
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const accessToken = cookieStore.get('access_token');

        if (!accessToken) {
            return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
        }

        // Check if this is a count or check request
        const { searchParams } = new URL(request.url);
        const ticker = searchParams.get('ticker');
        const exchange = searchParams.get('exchange');

        let endpoint = `${API_BASE}/watchlist`;

        // Forward query params if present
        if (ticker && exchange) {
            endpoint = `${API_BASE}/watchlist/check?ticker=${ticker}&exchange=${exchange}`;
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${accessToken.value}`,
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Watchlist GET error:', error);
        return NextResponse.json({ detail: 'Failed to fetch watchlist' }, { status: 500 });
    }
}

/**
 * POST /api/watchlist - Add stock to watchlist
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const accessToken = cookieStore.get('access_token');

        if (!accessToken) {
            return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();

        const response = await fetch(`${API_BASE}/watchlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${accessToken.value}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Watchlist POST error:', error);
        return NextResponse.json({ detail: 'Failed to add to watchlist' }, { status: 500 });
    }
}

/**
 * DELETE /api/watchlist - Remove stock from watchlist
 */
export async function DELETE(request: NextRequest) {
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
            `${API_BASE}/watchlist?ticker=${ticker}&exchange=${exchange}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `access_token=${accessToken.value}`,
                },
            }
        );

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Watchlist DELETE error:', error);
        return NextResponse.json({ detail: 'Failed to remove from watchlist' }, { status: 500 });
    }
}
