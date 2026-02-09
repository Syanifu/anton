/**
 * Dispatcher: message-pipeline
 * Loads context and executes anton-message-pipeline mission
 */

import { getSupabase } from '@/lib/supabase';
import { EventEnvelope } from '../mission';
import { mission as messagePipeline } from '../../anton-message-pipeline/mission';

export async function executePipeline(payload: EventEnvelope): Promise<void> {
    const supabase = getSupabase();
    const { resource_id: messageId, user_id: userId } = payload;

    // Fetch message with related data
    const { data: message, error: msgError } = await supabase
        .from('messages')
        .select(`
            id,
            content,
            direction,
            created_at,
            conversation_id
        `)
        .eq('id', messageId)
        .single();

    if (msgError || !message) {
        throw new Error(`Message not found: ${messageId}`);
    }

    // Fetch conversation
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
            id,
            channel,
            external_thread_id,
            client_id
        `)
        .eq('id', message.conversation_id)
        .single();

    if (convError || !conversation) {
        throw new Error(`Conversation not found: ${message.conversation_id}`);
    }

    // Fetch client
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
            id,
            name,
            phone,
            email
        `)
        .eq('id', conversation.client_id)
        .single();

    if (clientError || !client) {
        throw new Error(`Client not found: ${conversation.client_id}`);
    }

    // Count client's conversations for repeat client detection
    const { count: conversationCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);

    // Fetch conversation history (last 10 messages)
    const { data: history } = await supabase
        .from('messages')
        .select('content, direction, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(10);

    const conversationHistory = (history || [])
        .reverse()
        .map((m) => ({
            role: (m.direction === 'incoming' ? 'client' : 'freelancer') as 'client' | 'freelancer',
            content: m.content,
            timestamp: m.created_at,
        }));

    // Execute the message pipeline mission
    await messagePipeline.execute({
        userId,
        supabase,
        input: {
            message: {
                id: message.id,
                content: message.content,
                direction: message.direction,
                createdAt: message.created_at,
            },
            conversation: {
                id: conversation.id,
                channel: conversation.channel,
                externalThreadId: conversation.external_thread_id,
            },
            client: {
                id: client.id,
                name: client.name,
                phone: client.phone,
                email: client.email,
                conversationCount: conversationCount || 1,
            },
            conversationHistory,
        },
    });
}
