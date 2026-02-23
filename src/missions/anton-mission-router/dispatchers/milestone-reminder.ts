/**
 * Dispatcher: milestone-reminder
 * Triggered by: CRON daily at 8am (milestone.approaching event)
 *
 * Checks milestones due within 48 hours and creates task reminders.
 * Note: This also runs via SQL CRON in the database triggers,
 * but the Antigravity version adds richer context.
 */

import { getSupabase } from '@/lib/supabase';
import { EventEnvelope } from '../mission';

export async function executeMilestoneReminder(payload: EventEnvelope): Promise<void> {
    const supabase = getSupabase();
    const { user_id: userId } = payload;

    const today = new Date().toISOString().split('T')[0];
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    // Fetch milestones due within 48 hours for user's projects
    const { data: milestones, error } = await supabase
        .from('milestones')
        .select(`
            id,
            title,
            due_date,
            project_id,
            projects!inner (
                id,
                title,
                user_id,
                client_id
            )
        `)
        .is('completed_at', null)
        .gte('due_date', today)
        .lte('due_date', twoDaysFromNow);

    if (error || !milestones) return;

    for (const milestone of milestones) {
        const project = (milestone as Record<string, unknown>).projects as {
            id: string;
            title: string;
            user_id: string;
            client_id: string;
        };

        // Only process milestones for this user
        if (project.user_id !== userId) continue;

        // Check if reminder task already exists (avoid duplicates)
        const { count } = await supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', milestone.project_id)
            .ilike('title', `%Milestone due soon: ${milestone.title}%`)
            .gte('created_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());

        if (count && count > 0) continue; // Already reminded

        await supabase
            .from('tasks')
            .insert({
                user_id: userId,
                title: `Milestone due soon: ${milestone.title} (${project.title})`,
                priority: 'high',
                due_date: milestone.due_date,
                project_id: milestone.project_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
    }
}
