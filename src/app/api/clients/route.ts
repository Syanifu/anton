import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthenticatedClient,
    isAuthError,
    errorResponse,
} from '@/lib/supabase-server';

/**
 * GET /api/clients
 *
 * Lists all clients for the authenticated user, sorted by last_interaction_at desc.
 */
export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;

    const { data: clients, error } = await supabase
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
            last_interaction_at
        `)
        .eq('user_id', userId)
        .order('last_interaction_at', { ascending: false, nullsFirst: false });

    if (error) {
        return errorResponse(`Failed to fetch clients: ${error.message}`, 500);
    }

    return NextResponse.json({ clients: clients || [] });
}
