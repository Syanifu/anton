import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthenticatedClient,
    isAuthError,
    errorResponse,
} from '@/lib/supabase-server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/clients/:id
 *
 * Returns a single client with related conversations, leads, projects, and invoices.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;
    const { id } = await params;

    // Fetch client with related data using Supabase joins
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
            id,
            name,
            company,
            email,
            phone,
            channels,
            tags,
            total_revenue,
            active_projects_count,
            last_interaction_at,
            ai_notes,
            metadata,
            created_at,
            updated_at,
            conversations (
                id,
                channel,
                last_message_at,
                ai_summary,
                lead_score,
                status,
                reply_pending,
                unread_count
            ),
            leads (
                id,
                score,
                priority,
                status,
                ai_summary,
                converted_to_project_id,
                converted_at,
                created_at
            ),
            projects (
                id,
                title,
                stage,
                status,
                budget,
                currency,
                deadline,
                start_date,
                created_at
            ),
            invoices (
                id,
                amount,
                status,
                due_date,
                description,
                created_at
            )
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (clientError || !client) {
        return errorResponse('Client not found', 404);
    }

    return NextResponse.json(client);
}

/**
 * PATCH /api/clients/:id
 *
 * Updates client details. Accepts partial body with: name, company, tags, email, phone.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;
    const { id } = await params;

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid JSON body', 400);
    }

    // Only allow updating specific fields
    const allowedFields = ['name', 'company', 'tags', 'email', 'phone'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
        if (field in body) {
            updates[field] = body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return errorResponse('No valid fields to update', 400);
    }

    updates.updated_at = new Date().toISOString();

    const { data: client, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select('id, name, company, email, phone, channels, tags, total_revenue, active_projects_count, last_interaction_at, updated_at')
        .single();

    if (error) {
        return errorResponse(`Failed to update client: ${error.message}`, 500);
    }

    if (!client) {
        return errorResponse('Client not found', 404);
    }

    return NextResponse.json(client);
}
