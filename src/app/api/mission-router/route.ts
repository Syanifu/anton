import { NextRequest, NextResponse } from 'next/server';
import { routeEvent, EventEnvelope } from '@/missions/anton-mission-router/mission';

// This secret key MUST match the ANTIGRAVITY_API_KEY environment variable
// used by the caller (e.g. the webhook handler)
const API_KEY = process.env.ANTIGRAVITY_API_KEY!;

export async function POST(request: NextRequest) {
    // 1. Validate API Key
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { error: 'Missing or invalid Authorization header' },
            { status: 401 }
        );
    }

    const token = authHeader.split(' ')[1];

    // Simple equality check for the API key
    // In a production production system with many keys, this would be a database lookup
    if (token !== API_KEY) {
        return NextResponse.json(
            { error: 'Invalid API Key' },
            { status: 403 }
        );
    }

    // 2. Parse body
    let payload: Partial<EventEnvelope>;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        );
    }

    // 3. Route the event
    try {
        const result = await routeEvent(payload);

        if (!result.dispatched) {
            return NextResponse.json(
                result,
                { status: 400 } // Bad request if routing failed due to validation/unknown event
            );
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error('Mission router error:', error);
        return NextResponse.json(
            {
                dispatched: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
