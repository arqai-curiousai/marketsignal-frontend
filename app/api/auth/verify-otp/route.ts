import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api/backendUrl';

const API_BASE = BACKEND_URL;

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 });
        }

        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
            signal: AbortSignal.timeout(15_000),
        });

        const data = await response.json().catch(() => ({ detail: 'Invalid server response' }));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.detail || 'Invalid OTP' },
                { status: response.status }
            );
        }

        const res = NextResponse.json(data);

        // Forward all Set-Cookie headers from backend response
        const setCookies = response.headers.getSetCookie?.() ?? [];
        for (const cookie of setCookies) {
            res.headers.append('Set-Cookie', cookie);
        }

        return res;
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
