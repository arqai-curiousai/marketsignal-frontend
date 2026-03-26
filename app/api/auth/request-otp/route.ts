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

        const response = await fetch(`${API_BASE}/auth/request-otp`, {
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
                { error: data.detail || 'Failed to send OTP' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Request OTP error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
