import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend.arthsarthi.arqai.tech/api/v1';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.detail || 'Invalid OTP' },
                { status: response.status }
            );
        }

        const res = NextResponse.json(data);

        // Forward Set-Cookie headers from backend response
        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
            // Need to handle multiple cookies if present, but usually fetches merge them or we need to split
            // basic forwarding:
            res.headers.set('Set-Cookie', setCookieHeader);
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
