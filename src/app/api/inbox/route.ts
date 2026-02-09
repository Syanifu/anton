import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthenticatedClient,
    isAuthError,
    errorResponse,
} from '@/lib/supabase-server';

/**
 * GET /api/inbox
 *
 * Returns conversations with:
 * - Client name, channel, unread count
 * - Last message + AI summary
 * - Ordered by last_message_at desc
 */
export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;

    // Parse query params for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const filter = searchParams.get('filter'); // 'unread', 'leads', 'idle'

    // Build query
    let query = supabase
        .from('conversations')
        .select(`
            id,
            channel,
            unread_count,
            last_message_at,
            ai_summary,
            lead_score,
            status,
            reply_pending,
            clients (
                id,
                name,
                phone,
                email
            )
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

    // Apply filters
    if (filter === 'unread') {
        query = query.gt('unread_count', 0);
    } else if (filter === 'leads') {
        query = query.gte('lead_score', 0.6);
    } else if (filter === 'idle') {
        query = query.eq('status', 'idle');
    }

    const { data: conversations, error } = await query;

    if (error) {
        return errorResponse(`Failed to fetch conversations: ${error.message}`, 500);
    }

    // Define conversation type
    interface ConversationRow {
        id: string;
        channel: string;
        unread_count: number;
        last_message_at: string;
        ai_summary: string | null;
        lead_score: number | null;
        status: string;
        reply_pending: boolean;
        clients: { id: string; name: string; phone?: string; email?: string } | null;
    }

    // Fetch last message for each conversation
    const conversationIds = (conversations || []).map((c: ConversationRow) => c.id);

    const { data: lastMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, direction, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

    // Define message type
    interface MessageRow {
        conversation_id: string;
        content: string;
        direction: string;
        created_at: string;
    }

    // Group messages by conversation and take the first (most recent)
    const lastMessageMap = new Map<string, MessageRow>();
    for (const msg of (lastMessages || []) as MessageRow[]) {
        if (!lastMessageMap.has(msg.conversation_id)) {
            lastMessageMap.set(msg.conversation_id, msg);
        }
    }

    // Format response
    const response = ((conversations || []) as ConversationRow[]).map((conv) => {
        const lastMessage = lastMessageMap.get(conv.id);
        const client = conv.clients as { id: string; name: string; phone?: string; email?: string } | null;

        return {
            id: conv.id,
            clientName: client?.name || 'Unknown',
            clientId: client?.id,
            channel: conv.channel,
            unreadCount: conv.unread_count || 0,
            lastMessageAt: conv.last_message_at,
            aiSummary: conv.ai_summary,
            leadScore: conv.lead_score,
            status: conv.status,
            replyPending: conv.reply_pending,
            lastMessage: lastMessage
                ? {
                    text: lastMessage.content,
                    sender: lastMessage.direction === 'incoming' ? 'client' : 'me',
                    timestamp: lastMessage.created_at,
                }
                : null,
        };
    });

    return NextResponse.json({
        conversations: response,
        pagination: {
            limit,
            offset,
            hasMore: response.length === limit,
        },
    });
}
