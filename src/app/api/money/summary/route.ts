import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthenticatedClient,
    isAuthError,
    errorResponse,
} from '@/lib/supabase-server';

/**
 * GET /api/money/summary
 *
 * Returns financial summary:
 * - earnedThisMonth: Total paid invoices this month (net of platform fees)
 * - outstanding: Total of sent + overdue invoices
 * - expected: Sum of draft invoices
 * - overdueCount: Number of overdue invoices
 * - netIncome: Net income (earned minus platform fees)
 */
export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, amount, status, platform_fee, due_date, created_at')
        .eq('user_id', userId);

    if (error) {
        return errorResponse(`Failed to fetch invoices: ${error.message}`, 500);
    }

    interface InvoiceRow {
        id: string;
        amount: number;
        status: string;
        platform_fee: number | null;
        due_date: string;
        created_at: string;
    }

    const all = (invoices || []) as InvoiceRow[];

    // Calculate current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Earned this month: paid invoices within current month (net of platform fees)
    const earnedThisMonth = all
        .filter(
            (inv) =>
                inv.status === 'paid' &&
                inv.created_at >= startOfMonth &&
                inv.created_at <= endOfMonth
        )
        .reduce((sum, inv) => sum + (inv.amount - (inv.platform_fee || 0)), 0);

    // Outstanding: sent + overdue
    const outstanding = all
        .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.amount, 0);

    // Expected: draft invoices
    const expected = all
        .filter((inv) => inv.status === 'draft')
        .reduce((sum, inv) => sum + inv.amount, 0);

    // Overdue count
    const overdueCount = all.filter((inv) => inv.status === 'overdue').length;

    // Net income: all-time paid minus platform fees
    const netIncome = all
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.amount - (inv.platform_fee || 0)), 0);

    return NextResponse.json({
        earnedThisMonth,
        outstanding,
        expected,
        overdueCount,
        netIncome,
    });
}
