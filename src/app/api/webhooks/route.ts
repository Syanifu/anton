import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;
const ANTIGRAVITY_ROUTER_ENDPOINT = process.env.ANTIGRAVITY_ROUTER_ENDPOINT!;
const ANTIGRAVITY_API_KEY = process.env.ANTIGRAVITY_API_KEY!;

interface WebhookPayload {
    event: string;
    resource_id: string;
    user_id: string;
    timestamp: string;
}

export async function POST(request: NextRequest) {
    const supabase = getSupabase();

    // 1. Validate webhook secret
    const secret = request.headers.get('x-webhook-secret');
    if (secret !== WEBHOOK_SECRET) {
        return NextResponse.json(
            { error: 'Invalid webhook secret' },
            { status: 400 }
        );
    }

    // 2. Parse JSON body
    let payload: WebhookPayload;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        );
    }

    // 3. Validate required fields
    const { event, resource_id, user_id, timestamp } = payload;
    const missingFields: string[] = [];

    if (!event) missingFields.push('event');
    if (!resource_id) missingFields.push('resource_id');
    if (!user_id) missingFields.push('user_id');
    if (!timestamp) missingFields.push('timestamp');

    if (missingFields.length > 0) {
        return NextResponse.json(
            { error: 'Missing required fields', missing: missingFields },
            { status: 400 }
        );
    }

    // 4. Log to mission_logs
    await supabase.from('mission_logs').insert({
        event,
        resource_id,
        user_id,
        timestamp,
        status: 'received',
        created_at: new Date().toISOString(),
    });

    // 5. POST to Antigravity router
    try {
        const response = await fetch(ANTIGRAVITY_ROUTER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${ANTIGRAVITY_API_KEY}`,
            },
            body: JSON.stringify({ event, resource_id, user_id, timestamp }),
        });

        if (!response.ok) {
            // Log failure to mission_logs
            await supabase.from('mission_logs').insert({
                event,
                resource_id,
                user_id,
                timestamp,
                status: 'dispatch_failed',
                error: `Antigravity returned ${response.status}: ${response.statusText}`,
                created_at: new Date().toISOString(),
            });

            return NextResponse.json(
                { error: 'Failed to dispatch to Antigravity', status: response.status },
                { status: 502 }
            );
        }

        // 6. Return success
        return NextResponse.json({ dispatched: true }, { status: 200 });
    } catch (error) {
        // Log error to mission_logs
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await supabase.from('mission_logs').insert({
            event,
            resource_id,
            user_id,
            timestamp,
            status: 'dispatch_error',
            error: errorMessage,
            created_at: new Date().toISOString(),
        });

        return NextResponse.json(
            { error: 'Failed to reach Antigravity', details: errorMessage },
            { status: 502 }
        );
    }
}
