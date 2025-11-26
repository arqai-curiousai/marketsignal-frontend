import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_ORIGIN || 'https://backend.arthsarthi.arqai.tech';
const API_TIMEOUT = 30000; // 30 seconds

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function sanitizeError(error: unknown): string {
    if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
            return 'Backend service temporarily unavailable';
        }
        return 'An error occurred processing your request';
    }
    return 'Unknown error occurred';
}

function buildBackendUrl(path: string[]): string {
    const pathString = path.join('/');
    return `${BACKEND_URL}/api/v1/auth/${pathString}`;
}

async function forwardRequest(
    backendUrl: string,
    method: string,
    body: string | null,
    headers: HeadersInit
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const response = await fetch(backendUrl, {
            method,
            headers,
            body,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * POST handler for authentication endpoints
 * (This one was already mostly correct – `params` is a Promise here)
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const { path } = await context.params;
    let backendUrl = '';

    try {
        if (!ALLOWED_METHODS.includes('POST')) {
            return NextResponse.json(
                { error: 'Method not allowed' },
                { status: 405 }
            );
        }

        backendUrl = buildBackendUrl(path);

        console.log(`[API Proxy] POST ${backendUrl}`);

        const body = await request.text();

        if (body) {
            try {
                JSON.parse(body);
            } catch {
                return NextResponse.json(
                    { error: 'Invalid JSON in request body' },
                    { status: 400 }
                );
            }
        }

        const forwardHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        const response = await forwardRequest(
            backendUrl,
            'POST',
            body,
            forwardHeaders
        );

        const data = await response.text();

        console.log(`[API Proxy] Response: ${response.status}`);

        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('[API Proxy] Detailed Error:', {
            type: (error as any)?.constructor?.name,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            backendUrl,
        });

        const errorMessage = sanitizeError(error);

        return NextResponse.json(
            {
                error: errorMessage,
                detail: errorMessage,
            },
            { status: 502 }
        );
    }
}

/**
 * GET handler for authentication endpoints
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> } // <-- CHANGED
) {
    try {
        const { path } = await params; // <-- CHANGED
        const backendUrl = buildBackendUrl(path);

        const searchParams = request.nextUrl.searchParams.toString();
        const fullUrl = searchParams ? `${backendUrl}?${searchParams}` : backendUrl;

        console.log(`[API Proxy] GET ${fullUrl}`);

        const response = await forwardRequest(
            fullUrl,
            'GET',
            null,
            {
                Accept: 'application/json',
            }
        );

        const data = await response.text();
        console.log(`[API Proxy] Response: ${response.status}`);

        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('[API Proxy] Error:', error);

        const msg = sanitizeError(error);
        return NextResponse.json(
            {
                error: msg,
                detail: msg,
            },
            { status: 502 }
        );
    }
}

/**
 * PUT handler for authentication endpoints
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> } // <-- CHANGED
) {
    try {
        const { path } = await params; // <-- CHANGED
        const backendUrl = buildBackendUrl(path);
        const body = await request.text();

        console.log(`[API Proxy] PUT ${backendUrl}`);

        if (body) {
            try {
                JSON.parse(body);
            } catch {
                return NextResponse.json(
                    { error: 'Invalid JSON in request body' },
                    { status: 400 }
                );
            }
        }

        const response = await forwardRequest(
            backendUrl,
            'PUT',
            body,
            {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            }
        );

        const data = await response.text();
        console.log(`[API Proxy] Response: ${response.status}`);

        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('[API Proxy] Error:', error);

        const msg = sanitizeError(error);
        return NextResponse.json(
            {
                error: msg,
                detail: msg,
            },
            { status: 502 }
        );
    }
}

/**
 * DELETE handler for authentication endpoints
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> } // <-- CHANGED
) {
    try {
        const { path } = await params; // <-- CHANGED
        const backendUrl = buildBackendUrl(path);

        console.log(`[API Proxy] DELETE ${backendUrl}`);

        const response = await forwardRequest(
            backendUrl,
            'DELETE',
            null,
            {
                Accept: 'application/json',
            }
        );

        const data = await response.text();
        console.log(`[API Proxy] Response: ${response.status}`);

        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('[API Proxy] Error:', error);

        const msg = sanitizeError(error);
        return NextResponse.json(
            {
                error: msg,
                detail: msg,
            },
            { status: 502 }
        );
    }
}
