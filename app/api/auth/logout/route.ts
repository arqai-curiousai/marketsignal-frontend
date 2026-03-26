import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/lib/api/backendUrl';

const API_BASE = BACKEND_URL;

export async function POST(_request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token');

        // Calls backend logout to invalidate session if needed
        // Even if backend call fails, we should clear cookies on frontend
        try {
            if (accessToken) {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Cookie': `access_token=${accessToken.value}`,
                    },
                    cache: 'no-store',
                    signal: AbortSignal.timeout(15_000),
                });
            }
        } catch (e) {
            console.error('Backend logout failed', e);
        }

        const response = NextResponse.json({ message: 'Logged out successfully' });

        // Clear cookies with explicit attributes for reliable deletion
        response.cookies.set('access_token', '', { maxAge: 0, httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
        response.cookies.set('refresh_token', '', { maxAge: 0, httpOnly: true, secure: true, sameSite: 'lax', path: '/' });

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
