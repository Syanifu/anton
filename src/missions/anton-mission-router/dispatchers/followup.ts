/**
 * Dispatcher: followup
 * Handles conversation.idle events
 * TODO: Implement full followup-mission
 */

import { getSupabase } from '@/lib/supabase';
import { EventEnvelope } from '../mission';

export async function executeFollowup(payload: EventEnvelope): Promise<void> {
    const supabase = getSupabase();
    const { resource_id: conversationId, user_id: userId } = payload;

    // Fetch conversation with client data
    const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
            *,
            clients (
                id,
                name,
                email,
                phone
            )
        `)
        .eq('id', conversationId)
        .single();

    if (error || !conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
    }

    // TODO: Implement followup logic
    // - Analyze conversation context
    // - Generate appropriate follow-up message
    // - Schedule sending based on urgency
    // - Create draft for user review

    console.log(`[followup] Processing idle conversation ${conversationId} for user ${userId}`);
}
