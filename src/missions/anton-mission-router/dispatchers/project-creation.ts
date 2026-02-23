/**
 * Dispatcher: project-creation
 * Triggered by: lead.converted event
 *
 * Steps:
 * 1. Read lead record + linked client/conversation
 * 2. Create project: title from lead, client_id, conversation_id, budget, stage='discovery'
 * 3. Update lead: set converted_to_project_id and converted_at
 * 4. Create task: "New project created: [title] — set deadline and milestones"
 * 5. Return project record
 */

import { getSupabase } from '@/lib/supabase';
import { EventEnvelope } from '../mission';

export async function executeProjectCreation(payload: EventEnvelope): Promise<void> {
    const supabase = getSupabase();
    const { resource_id: leadId, user_id: userId } = payload;

    // 1. Read lead record with linked data
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, title, score, budget, client_id, conversation_id, metadata')
        .eq('id', leadId)
        .single();

    if (leadError || !lead) {
        throw new Error(`Lead not found: ${leadId}`);
    }

    // Fetch client name for the task description
    let clientName = 'Unknown Client';
    if (lead.client_id) {
        const { data: client } = await supabase
            .from('clients')
            .select('name')
            .eq('id', lead.client_id)
            .single();
        if (client) clientName = client.name;
    }

    // 2. Create project
    const projectTitle = lead.title || `Project with ${clientName}`;
    const budget = lead.budget || lead.metadata?.budget?.amount || null;

    const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
            user_id: userId,
            client_id: lead.client_id,
            lead_id: lead.id,
            conversation_id: lead.conversation_id,
            title: projectTitle,
            budget,
            stage: 'discovery',
            status: 'on_track',
        })
        .select('id, title')
        .single();

    if (projectError || !project) {
        throw new Error(`Failed to create project: ${projectError?.message}`);
    }

    // 3. Update lead with conversion info
    await supabase
        .from('leads')
        .update({
            converted_to_project_id: project.id,
            converted_at: new Date().toISOString(),
        })
        .eq('id', leadId);

    // 4. Create task for the freelancer
    await supabase
        .from('tasks')
        .insert({
            user_id: userId,
            title: `New project created: ${project.title} — set deadline and milestones`,
            priority: 'high',
            project_id: project.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
}
