import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/lib/api/backendUrl';

const API_BASE = BACKEND_URL;

/**
 * GET /api/watchlist - Get user's watchlist
 */
export async function GET(_request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token');

        if (!accessToken) {
            return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
        }

        const response = await fetch(`${API_BASE}/watchlist`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${accessToken.value}`,
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(15_000),
        });

        const data = await response.json().catch(() => ({ detail: 'Invalid server response' }));
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
        const cookieStore = await cookies();
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
            cache: 'no-store',
            signal: AbortSignal.timeout(15_000),
        });

        const data = await response.json().catch(() => ({ detail: 'Invalid server response' }));
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
        const cookieStore = await cookies();
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

        const deleteUrl = new URL(`${API_BASE}/watchlist`);
        deleteUrl.searchParams.append('ticker', ticker);
        deleteUrl.searchParams.append('exchange', exchange);
        const response = await fetch(
            deleteUrl.toString(),
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `access_token=${accessToken.value}`,
                },
                cache: 'no-store',
                signal: AbortSignal.timeout(15_000),
            }
        );

        const data = await response.json().catch(() => ({ detail: 'Invalid server response' }));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Watchlist DELETE error:', error);
        return NextResponse.json({ detail: 'Failed to remove from watchlist' }, { status: 500 });
    }
}
