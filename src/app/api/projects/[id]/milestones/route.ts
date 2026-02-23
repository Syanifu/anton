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
 * POST /api/projects/:id/milestones
 *
 * Adds a milestone to a project.
 * Body: { title, due_date?, sort_order? }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;
    const { id: projectId } = await params;

    // Verify the project belongs to the user
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

    if (projectError || !project) {
        return errorResponse('Project not found', 404);
    }

    let body: { title?: string; due_date?: string; sort_order?: number };
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid JSON body', 400);
    }

    if (!body.title) {
        return errorResponse('title is required', 400);
    }

    const { data: milestone, error } = await supabase
        .from('milestones')
        .insert({
            project_id: projectId,
            title: body.title,
            due_date: body.due_date || null,
            sort_order: body.sort_order ?? 0,
        })
        .select('id, project_id, title, due_date, completed_at, sort_order, created_at')
        .single();

    if (error) {
        return errorResponse(`Failed to create milestone: ${error.message}`, 500);
    }

    return NextResponse.json(milestone, { status: 201 });
}
