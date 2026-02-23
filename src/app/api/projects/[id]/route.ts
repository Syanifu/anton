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
 * GET /api/projects/:id
 *
 * Returns a single project with milestones, client info, and linked conversation.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;
    const { id } = await params;

    const { data: project, error } = await supabase
        .from('projects')
        .select(`
            id,
            title,
            description,
            client_id,
            lead_id,
            conversation_id,
            stage,
            status,
            budget,
            currency,
            start_date,
            deadline,
            completed_at,
            metadata,
            created_at,
            updated_at,
            clients (
                id,
                name,
                company,
                email,
                phone
            ),
            milestones (
                id,
                title,
                due_date,
                completed_at,
                sort_order,
                created_at
            ),
            conversations (
                id,
                channel,
                last_message_at,
                ai_summary,
                status
            )
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error || !project) {
        return errorResponse('Project not found', 404);
    }

    return NextResponse.json(project);
}

/**
 * PATCH /api/projects/:id
 *
 * Updates project details. Accepts partial body with: stage, deadline, description, start_date.
 * Also updates updated_at.
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

    const allowedFields = ['stage', 'deadline', 'description', 'start_date'];
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

    // If stage is being set to 'completed', also set completed_at
    if (updates.stage === 'completed') {
        updates.completed_at = new Date().toISOString();
    }

    const { data: project, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select(`
            id,
            title,
            description,
            client_id,
            stage,
            status,
            budget,
            currency,
            start_date,
            deadline,
            completed_at,
            updated_at
        `)
        .single();

    if (error) {
        return errorResponse(`Failed to update project: ${error.message}`, 500);
    }

    if (!project) {
        return errorResponse('Project not found', 404);
    }

    return NextResponse.json(project);
}
