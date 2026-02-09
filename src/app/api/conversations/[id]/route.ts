import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthenticatedClient,
    isAuthError,
    errorResponse,
} from '@/lib/supabase-server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/conversations/:id
 *
 * Returns full conversation detail:
 * - Message timeline
 * - Pending drafts
 * - Lead status if exists
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;
    const { id: conversationId } = await params;

    // Fetch conversation with client data
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
            id,
            channel,
            external_thread_id,
            unread_count,
            last_message_at,
            ai_summary,
            lead_score,
            status,
            reply_pending,
            created_at,
            clients (
                id,
                name,
                phone,
                email
            )
        `)
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

    if (convError || !conversation) {
        return errorResponse('Conversation not found', 404);
    }

    // Fetch all data in parallel
    const [messagesResult, draftsResult, leadResult] = await Promise.all([
        // Full message timeline
        supabase
            .from('messages')
            .select('id, content, direction, external_message_id, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true }),

        // Pending drafts for this conversation
        supabase
            .from('drafts')
            .select('id, short, detailed, confidence, intent, status, created_at')
            .eq('conversation_id', conversationId)
            .eq('status', 'pending'),

        // Lead status if exists
        supabase
            .from('leads')
            .select('id, score, priority, status, ai_summary, entities, created_at')
            .eq('conversation_id', conversationId)
            .single(),
    ]);

    // Mark conversation as read (reset unread count)
    if (conversation.unread_count > 0) {
        await supabase
            .from('conversations')
            .update({ unread_count: 0 })
            .eq('id', conversationId);
    }

    const client = conversation.clients as { id: string; name: string; phone?: string; email?: string } | null;

    // Format response
    const response = {
        id: conversation.id,
        channel: conversation.channel,
        externalThreadId: conversation.external_thread_id,
        status: conversation.status,
        aiSummary: conversation.ai_summary,
        leadScore: conversation.lead_score,
        replyPending: conversation.reply_pending,
        createdAt: conversation.created_at,

        client: client
            ? {
                id: client.id,
                name: client.name,
                phone: client.phone,
                email: client.email,
            }
            : null,

        messages: (messagesResult.data || []).map((msg: {
            id: string;
            content: string;
            direction: string;
            external_message_id: string | null;
            created_at: string;
        }) => ({
            id: msg.id,
            text: msg.content,
            sender: msg.direction === 'incoming' ? 'client' : 'me',
            externalId: msg.external_message_id,
            timestamp: msg.created_at,
        })),

        drafts: (draftsResult.data || []).map((draft: {
            id: string;
            short: string;
            detailed: string;
            confidence: number;
            intent: string;
            status: string;
            created_at: string;
        }) => ({
            id: draft.id,
            short: draft.short,
            detailed: draft.detailed,
            confidence: draft.confidence,
            intent: draft.intent,
            status: draft.status,
            createdAt: draft.created_at,
        })),

        lead: leadResult.data
            ? {
                id: leadResult.data.id,
                score: leadResult.data.score,
                priority: leadResult.data.priority,
                status: leadResult.data.status,
                summary: leadResult.data.ai_summary,
                entities: leadResult.data.entities,
                createdAt: leadResult.data.created_at,
            }
            : null,
    };

    return NextResponse.json(response);
}
