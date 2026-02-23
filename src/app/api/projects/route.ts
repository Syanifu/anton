import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthenticatedClient,
    isAuthError,
    errorResponse,
} from '@/lib/supabase-server';

/**
 * GET /api/projects
 *
 * Lists projects for the authenticated user.
 * Accepts optional query params: stage, status.
 * Joins with clients to include client name.
 */
export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');

    let query = supabase
        .from('projects')
        .select(`
            id,
            title,
            client_id,
            stage,
            status,
            budget,
            currency,
            deadline,
            start_date,
            created_at,
            clients (
                id,
                name
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (stage) {
        query = query.eq('stage', stage);
    }

    if (status) {
        query = query.eq('status', status);
    }

    const { data: projects, error } = await query;

    if (error) {
        return errorResponse(`Failed to fetch projects: ${error.message}`, 500);
    }

    interface ProjectRow {
        id: string;
        title: string;
        client_id: string | null;
        stage: string;
        status: string;
        budget: number | null;
        currency: string;
        deadline: string | null;
        start_date: string | null;
        created_at: string;
        clients: { id: string; name: string } | null;
    }

    const formatted = ((projects || []) as ProjectRow[]).map((p) => ({
        id: p.id,
        title: p.title,
        client_id: p.client_id,
        clientName: p.clients?.name || null,
        stage: p.stage,
        status: p.status,
        budget: p.budget,
        currency: p.currency,
        deadline: p.deadline,
        start_date: p.start_date,
        created_at: p.created_at,
    }));

    return NextResponse.json({ projects: formatted });
}
