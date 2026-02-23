/**
 * Dispatcher: project-status-check
 * Triggered by: CRON daily at 8am (project.status_check event)
 *
 * Logic for each active project:
 * - Deadline past → status = 'overdue'
 * - Deadline within 3 days AND milestones incomplete → status = 'at_risk'
 * - Otherwise → status = 'on_track'
 * - Create tasks for status changes
 * - Overdue projects trigger Critical notification
 */

import { getSupabase } from '@/lib/supabase';
import { EventEnvelope } from '../mission';

export async function executeProjectStatusCheck(payload: EventEnvelope): Promise<void> {
    const supabase = getSupabase();
    const { user_id: userId } = payload;

    const today = new Date().toISOString().split('T')[0];
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    // Fetch all active projects for this user
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, title, deadline, status, client_id')
        .eq('user_id', userId)
        .not('stage', 'in', '("completed","cancelled")');

    if (error || !projects) return;

    for (const project of projects) {
        let newStatus = project.status;

        if (project.deadline && project.deadline < today) {
            // Deadline past → overdue
            newStatus = 'overdue';
        } else if (project.deadline && project.deadline <= threeDaysFromNow) {
            // Deadline within 3 days — check for incomplete milestones
            const { count } = await supabase
                .from('milestones')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', project.id)
                .is('completed_at', null);

            if (count && count > 0) {
                newStatus = 'at_risk';
            }
        } else {
            newStatus = 'on_track';
        }

        // Update status if changed
        if (newStatus !== project.status) {
            await supabase
                .from('projects')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', project.id);

            // Create task for status change
            const statusLabel = newStatus === 'overdue' ? 'OVERDUE' : 'AT RISK';
            await supabase
                .from('tasks')
                .insert({
                    user_id: userId,
                    title: `Project ${statusLabel}: ${project.title} — review immediately`,
                    priority: newStatus === 'overdue' ? 'critical' : 'high',
                    project_id: project.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
        }
    }
}
