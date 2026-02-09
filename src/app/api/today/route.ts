import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthenticatedClient,
    isAuthError,
    errorResponse,
} from '@/lib/supabase-server';

/**
 * GET /api/today
 *
 * Returns dashboard data:
 * - priority: Top 5 pending tasks by priority
 * - opportunities: Top 3 leads with score >= 0.6
 * - money: Invoice summary (paid this month, outstanding, expected)
 * - momentum: Reply pending count
 */
export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;

    // Fetch all data in parallel
    const [tasksResult, leadsResult, invoicesResult, conversationsResult] = await Promise.all([
        // Priority tasks: pending, ordered by priority desc, limit 5
        supabase
            .from('tasks')
            .select('id, title, description, priority, due_date, type, related_id')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('priority', { ascending: false })
            .limit(5),

        // Opportunities: leads with score >= 0.6, ordered by score desc, limit 3
        supabase
            .from('leads')
            .select(`
                id,
                score,
                priority,
                status,
                ai_summary,
                created_at,
                clients (
                    id,
                    name
                )
            `)
            .eq('user_id', userId)
            .gte('score', 0.6)
            .order('score', { ascending: false })
            .limit(3),

        // Invoices: fetch all for calculations
        supabase
            .from('invoices')
            .select('id, amount, status, platform_fee, due_date')
            .eq('user_id', userId),

        // Conversations with pending replies
        supabase
            .from('conversations')
            .select('id')
            .eq('user_id', userId)
            .eq('reply_pending', true),
    ]);

    // Define types for query results
    interface InvoiceRow {
        id: string;
        amount: number;
        status: string;
        platform_fee: number | null;
        due_date: string;
    }

    interface TaskRow {
        id: string;
        title: string;
        description: string | null;
        priority: number;
        due_date: string | null;
        type: string;
        related_id: string | null;
    }

    interface LeadRow {
        id: string;
        score: number;
        priority: string;
        status: string;
        ai_summary: string | null;
        created_at: string;
        clients: { id: string; name: string } | null;
    }

    // Calculate invoice summary
    const invoices = (invoicesResult.data || []) as InvoiceRow[];

    const paidThisMonth = invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.amount - (inv.platform_fee || 0)), 0);

    const outstanding = invoices
        .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.amount, 0);

    const expected = invoices
        .filter((inv) => inv.status === 'draft')
        .reduce((sum, inv) => sum + inv.amount, 0);

    const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

    // Format response
    const response = {
        priority: ((tasksResult.data || []) as TaskRow[]).map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.due_date,
            type: task.type,
            relatedId: task.related_id,
        })),

        opportunities: ((leadsResult.data || []) as LeadRow[]).map((lead) => ({
            id: lead.id,
            clientName: lead.clients?.name || 'Unknown',
            score: lead.score,
            priority: lead.priority,
            status: lead.status,
            summary: lead.ai_summary,
            createdAt: lead.created_at,
        })),

        money: {
            paidThisMonth,
            outstanding,
            expected,
            overdueCount,
            netIncome: paidThisMonth, // Already net of platform fees
        },

        momentum: {
            replyPendingCount: conversationsResult.data?.length || 0,
        },
    };

    return NextResponse.json(response);
}
