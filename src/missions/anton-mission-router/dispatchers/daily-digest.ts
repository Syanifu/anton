/**
 * Dispatcher: daily-digest
 * Triggered by: CRON daily at 7am (daily.digest event)
 *
 * Generates a morning business briefing with 5 sections:
 * 1. Priority Actions (max 5)
 * 2. Opportunities (leads score >= 0.6)
 * 3. Money Summary
 * 4. Active Projects
 * 5. Conversation Momentum
 */

import { getSupabase } from '@/lib/supabase';
import { EventEnvelope } from '../mission';

export interface DailyDigestResult {
    greeting: string;
    priorityActions: Array<{
        title: string;
        type: string;
        actionLabel: string;
        entityId: string;
    }>;
    opportunities: Array<{
        client: string;
        title: string;
        score: number;
        budget: number | null;
        leadId: string;
    }>;
    moneySummary: {
        earnedThisMonth: number;
        outstanding: number;
        expected: number;
    };
    activeProjects: Array<{
        title: string;
        stage: string;
        status: string;
        deadline: string | null;
        projectId: string;
    }>;
    momentum: {
        pendingReplies: number;
        idleConversations: number;
    };
}

export async function executeDailyDigest(payload: EventEnvelope): Promise<DailyDigestResult> {
    const supabase = getSupabase();
    const { user_id: userId } = payload;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Parallel data fetches
    const [
        tasksResult,
        leadsResult,
        paidInvoicesResult,
        outstandingInvoicesResult,
        projectsResult,
        pendingRepliesResult,
        idleConversationsResult,
        overdueInvoicesResult,
    ] = await Promise.all([
        // Priority tasks (incomplete, ordered by priority/due_date)
        supabase
            .from('tasks')
            .select('id, title, priority, due_date, project_id')
            .eq('user_id', userId)
            .is('completed_at', null)
            .order('due_date', { ascending: true, nullsFirst: false })
            .limit(10),

        // Hot/warm leads (score >= 0.6)
        supabase
            .from('leads')
            .select('id, title, score, budget, client_id, clients(name)')
            .eq('user_id', userId)
            .gte('score', 0.6)
            .is('converted_at', null)
            .order('score', { ascending: false })
            .limit(5),

        // Paid invoices this month
        supabase
            .from('invoices')
            .select('amount')
            .eq('user_id', userId)
            .eq('status', 'paid')
            .gte('updated_at', startOfMonth),

        // Outstanding invoices
        supabase
            .from('invoices')
            .select('id, amount, due_date, client_id')
            .eq('user_id', userId)
            .in('status', ['sent', 'overdue']),

        // Active projects
        supabase
            .from('projects')
            .select('id, title, stage, status, deadline')
            .eq('user_id', userId)
            .not('stage', 'in', '("completed","cancelled")')
            .order('deadline', { ascending: true, nullsFirst: false }),

        // Pending replies (incoming messages without response in last 6 hours)
        supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('last_message_at', sixHoursAgo),

        // Idle conversations (no activity in 3+ days)
        supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .lt('last_message_at', threeDaysAgo),

        // Overdue invoices
        supabase
            .from('invoices')
            .select('id, amount, client_id')
            .eq('user_id', userId)
            .eq('status', 'overdue'),
    ]);

    // Section 1: Priority Actions (max 5)
    const priorityActions: DailyDigestResult['priorityActions'] = [];

    // Add overdue invoices as priority
    for (const inv of overdueInvoicesResult.data || []) {
        if (priorityActions.length >= 5) break;
        priorityActions.push({
            title: `Overdue invoice: $${inv.amount}`,
            type: 'invoice_overdue',
            actionLabel: 'Send Reminder',
            entityId: inv.id,
        });
    }

    // Add urgent tasks
    for (const task of tasksResult.data || []) {
        if (priorityActions.length >= 5) break;
        priorityActions.push({
            title: task.title,
            type: 'task',
            actionLabel: 'Complete',
            entityId: task.id,
        });
    }

    // Section 2: Opportunities
    const opportunities: DailyDigestResult['opportunities'] = (leadsResult.data || []).map((lead) => {
        const clientData = lead.clients as unknown as { name: string } | null;
        return {
            client: clientData?.name || 'Unknown',
            title: lead.title || 'Untitled Lead',
            score: lead.score,
            budget: lead.budget,
            leadId: lead.id,
        };
    });

    // Section 3: Money Summary
    const earnedThisMonth = (paidInvoicesResult.data || [])
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const outstanding = (outstandingInvoicesResult.data || [])
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Section 4: Active Projects
    const activeProjects: DailyDigestResult['activeProjects'] = (projectsResult.data || []).map((p) => ({
        title: p.title,
        stage: p.stage,
        status: p.status,
        deadline: p.deadline,
        projectId: p.id,
    }));

    // Section 5: Momentum
    const pendingReplies = pendingRepliesResult.count || 0;
    const idleConversations = idleConversationsResult.count || 0;

    // Generate greeting
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    return {
        greeting: `Good ${timeOfDay}! Here's your business briefing.`,
        priorityActions,
        opportunities,
        moneySummary: {
            earnedThisMonth,
            outstanding,
            expected: outstanding, // Expected = outstanding for now
        },
        activeProjects,
        momentum: {
            pendingReplies,
            idleConversations,
        },
    };
}
