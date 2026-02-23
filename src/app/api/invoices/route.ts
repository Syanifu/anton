import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthenticatedClient,
    isAuthError,
    errorResponse,
} from '@/lib/supabase-server';

/**
 * GET /api/invoices
 *
 * Lists invoices for the authenticated user.
 * Joins with clients to include client name.
 */
export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
            id,
            client_id,
            project_id,
            amount,
            status,
            due_date,
            description,
            created_at,
            clients (
                id,
                name
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return errorResponse(`Failed to fetch invoices: ${error.message}`, 500);
    }

    interface InvoiceRow {
        id: string;
        client_id: string | null;
        project_id: string | null;
        amount: number;
        status: string;
        due_date: string;
        description: string | null;
        created_at: string;
        clients: { id: string; name: string } | null;
    }

    const formatted = ((invoices || []) as InvoiceRow[]).map((inv) => ({
        id: inv.id,
        client_id: inv.client_id,
        project_id: inv.project_id,
        clientName: inv.clients?.name || null,
        amount: inv.amount,
        status: inv.status,
        due_date: inv.due_date,
        description: inv.description,
        created_at: inv.created_at,
    }));

    return NextResponse.json({ invoices: formatted });
}

/**
 * POST /api/invoices
 *
 * Creates a draft invoice.
 * Body: { client_id, project_id?, amount, currency?, description, due_date }
 */
export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;

    let body: {
        client_id?: string;
        project_id?: string;
        amount?: number;
        currency?: string;
        description?: string;
        due_date?: string;
    };

    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid JSON body', 400);
    }

    if (!body.client_id) {
        return errorResponse('client_id is required', 400);
    }

    if (!body.amount || body.amount <= 0) {
        return errorResponse('amount must be a positive number', 400);
    }

    if (!body.due_date) {
        return errorResponse('due_date is required', 400);
    }

    const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
            user_id: userId,
            client_id: body.client_id,
            project_id: body.project_id || null,
            amount: body.amount,
            currency: body.currency || 'USD',
            description: body.description || null,
            due_date: body.due_date,
            status: 'draft',
        })
        .select(`
            id,
            client_id,
            project_id,
            amount,
            currency,
            status,
            due_date,
            description,
            created_at
        `)
        .single();

    if (error) {
        return errorResponse(`Failed to create invoice: ${error.message}`, 500);
    }

    return NextResponse.json(invoice, { status: 201 });
}
