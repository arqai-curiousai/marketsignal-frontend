import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/lib/api/backendUrl';

export async function POST(_request: NextRequest) {
    try {
        const cookieStore = cookies();
        const refreshToken = cookieStore.get('refresh_token');

        if (!refreshToken) {
            return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
        }

        const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `refresh_token=${refreshToken.value}`,
            },
        });

        if (!backendRes.ok) {
            const errBody = await backendRes.json().catch(() => ({}));
            return NextResponse.json(
                { error: errBody.detail || 'Refresh failed' },
                { status: backendRes.status },
            );
        }

        const data = await backendRes.json();

        // Forward Set-Cookie headers from backend
        const response = NextResponse.json(data);
        const setCookies = backendRes.headers.getSetCookie?.() ?? [];
        for (const cookie of setCookies) {
            response.headers.append('Set-Cookie', cookie);
        }

        return response;
    } catch (error) {
        console.error('Token refresh proxy error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
