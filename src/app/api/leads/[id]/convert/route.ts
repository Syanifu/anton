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
 * POST /api/leads/:id/convert
 *
 * Converts a lead to a project:
 * 1. Fetches the lead
 * 2. Creates a project from it (title, budget, client_id, conversation_id)
 * 3. Updates lead with converted_to_project_id and converted_at
 * 4. Creates a task "New project created: [title] - set deadline and milestones"
 * 5. Returns the new project
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;
    const { id: leadId } = await params;

    // 1. Fetch the lead
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select(`
            id,
            conversation_id,
            client_id,
            ai_summary,
            entities,
            status,
            converted_to_project_id,
            conversations (
                id,
                clients (
                    id,
                    name
                )
            )
        `)
        .eq('id', leadId)
        .eq('user_id', userId)
        .single();

    if (leadError || !lead) {
        return errorResponse('Lead not found', 404);
    }

    if (lead.converted_to_project_id) {
        return errorResponse('Lead has already been converted to a project', 400);
    }

    // Extract info for the project
    const conversation = lead.conversations as {
        id: string;
        clients: { id: string; name: string } | null;
    } | null;

    const clientName = conversation?.clients?.name || 'Unknown';
    const clientId = lead.client_id || conversation?.clients?.id || null;

    // Parse budget from entities if available
    const entities = lead.entities as Record<string, unknown> | null;
    const budget = entities?.budget ? Number(entities.budget) : null;

    // Build project title from lead summary or client name
    const title = lead.ai_summary
        ? `${clientName}: ${lead.ai_summary}`.slice(0, 200)
        : `Project for ${clientName}`;

    // 2. Create the project
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
            user_id: userId,
            client_id: clientId,
            lead_id: leadId,
            conversation_id: lead.conversation_id,
            title,
            budget,
            stage: 'discovery',
            status: 'on_track',
        })
        .select(`
            id,
            title,
            client_id,
            lead_id,
            conversation_id,
            stage,
            status,
            budget,
            currency,
            start_date,
            deadline,
            created_at,
            updated_at
        `)
        .single();

    if (projectError || !project) {
        return errorResponse(`Failed to create project: ${projectError?.message || 'Unknown error'}`, 500);
    }

    // 3. Update lead with conversion info
    const now = new Date().toISOString();
    await supabase
        .from('leads')
        .update({
            converted_to_project_id: project.id,
            converted_at: now,
            status: 'converted',
        })
        .eq('id', leadId)
        .eq('user_id', userId);

    // 4. Create a task for the new project
    await supabase
        .from('tasks')
        .insert({
            user_id: userId,
            title: `New project created: ${project.title} \u2014 set deadline and milestones`,
            type: 'action',
            status: 'pending',
            priority: 3,
            related_id: project.id,
            project_id: project.id,
        });

    // 5. Return the new project
    return NextResponse.json(project, { status: 201 });
}
