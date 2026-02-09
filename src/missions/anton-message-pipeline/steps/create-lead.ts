/**
 * Step 3 — Create Lead (conditional)
 *
 * If lead_score >= 0.60, insert into leads table with score & priority.
 * Only called when score threshold is met.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ConversationIntelligence, LeadPriority } from '../types';

interface CreateLeadInput {
    supabase: SupabaseClient;
    userId: string;
    clientId: string;
    conversationId: string;
    score: number;
    priority: LeadPriority;
    intelligence: ConversationIntelligence;
}

export async function createLead(input: CreateLeadInput): Promise<string> {
    const {
        supabase,
        userId,
        clientId,
        conversationId,
        score,
        priority,
        intelligence,
    } = input;

    // Check if lead already exists for this conversation
    const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('conversation_id', conversationId)
        .single();

    if (existingLead) {
        // Update existing lead
        const { data, error } = await supabase
            .from('leads')
            .update({
                score,
                priority,
                ai_summary: intelligence.aiSummary,
                intent: intelligence.intent,
                entities: intelligence.entities,
                suggested_actions: intelligence.suggestedActions,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingLead.id)
            .select('id')
            .single();

        if (error) {
            throw new Error(`Failed to update lead: ${error.message}`);
        }

        return data.id;
    }

    // Create new lead
    const { data, error } = await supabase
        .from('leads')
        .insert({
            user_id: userId,
            client_id: clientId,
            conversation_id: conversationId,
            score,
            priority,
            status: 'new',
            ai_summary: intelligence.aiSummary,
            intent: intelligence.intent,
            entities: intelligence.entities,
            suggested_actions: intelligence.suggestedActions,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

    if (error) {
        throw new Error(`Failed to create lead: ${error.message}`);
    }

    return data.id;
}
