import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/lib/api/backendUrl';

const API_BASE = BACKEND_URL;

export async function GET(_request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token');

        if (!accessToken) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Cookie': `access_token=${accessToken.value}`,
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
