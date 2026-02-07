import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend.arthsarthi.arqai.tech/api/v1';

export async function POST(_request: NextRequest) {
    try {
        const cookieStore = cookies();
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
                });
            }
        } catch (e) {
            console.error('Backend logout failed', e);
        }

        const response = NextResponse.json({ message: 'Logged out successfully' });

        // Clear cookies
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
