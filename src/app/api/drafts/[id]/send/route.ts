import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthenticatedClient,
    isAuthError,
    errorResponse,
} from '@/lib/supabase-server';
import { Channel } from '@/lib/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/drafts/:id/send
 *
 * Sends a draft:
 * - Insert as outgoing message
 * - Mark draft as sent
 * - Auto-complete related task
 * - Route to correct channel API
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;
    const { id: draftId } = await params;

    // Parse request body
    let body: { type?: 'short' | 'detailed' } = {};
    try {
        body = await request.json();
    } catch {
        // Default to short if no body
    }

    const replyType = body.type || 'short';

    // Fetch draft with conversation data
    const { data: draft, error: draftError } = await supabase
        .from('drafts')
        .select(`
            id,
            short,
            detailed,
            conversation_id,
            status,
            conversations (
                id,
                channel,
                external_thread_id,
                clients (
                    id,
                    name,
                    phone,
                    email
                )
            )
        `)
        .eq('id', draftId)
        .eq('user_id', userId)
        .single();

    if (draftError || !draft) {
        return errorResponse('Draft not found', 404);
    }

    if (draft.status === 'sent') {
        return errorResponse('Draft has already been sent', 400);
    }

    const conversation = draft.conversations as {
        id: string;
        channel: Channel;
        external_thread_id: string;
        clients: { id: string; name: string; phone?: string; email?: string } | null;
    } | null;

    if (!conversation) {
        return errorResponse('Conversation not found for draft', 404);
    }

    const messageContent = replyType === 'detailed' ? draft.detailed : draft.short;

    // 1. Send via channel API
    let externalMessageId: string | null = null;
    try {
        externalMessageId = await sendToChannel(
            conversation.channel,
            conversation.external_thread_id,
            messageContent,
            conversation.clients
        );
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
        return errorResponse(errorMsg, 502);
    }

    // 2. Insert as outgoing message
    const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversation.id,
            direction: 'outgoing',
            content: messageContent,
            external_message_id: externalMessageId,
            created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

    if (msgError) {
        return errorResponse(`Failed to save message: ${msgError.message}`, 500);
    }

    // 3. Mark draft as sent
    await supabase
        .from('drafts')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', draftId);

    // 4. Update conversation
    await supabase
        .from('conversations')
        .update({
            last_message_at: new Date().toISOString(),
            reply_pending: false,
        })
        .eq('id', conversation.id);

    // 5. Auto-complete related task
    await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('related_id', conversation.id)
        .eq('type', 'reply')
        .eq('status', 'pending');

    return NextResponse.json({
        success: true,
        messageId: message.id,
        externalMessageId,
        channel: conversation.channel,
    });
}

/**
 * Routes message to the correct channel API
 */
async function sendToChannel(
    channel: Channel,
    externalThreadId: string,
    content: string,
    client: { id: string; name: string; phone?: string; email?: string } | null
): Promise<string | null> {
    switch (channel) {
        case 'whatsapp':
            return await sendWhatsApp(externalThreadId, content);

        case 'email':
            return await sendEmail(client?.email || externalThreadId, content);

        case 'slack':
            return await sendSlack(externalThreadId, content);

        case 'telegram':
            return await sendTelegram(externalThreadId, content);

        default:
            throw new Error(`Unsupported channel: ${channel}`);
    }
}

async function sendWhatsApp(phone: string, content: string): Promise<string> {
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
        throw new Error('WhatsApp API not configured');
    }

    const response = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phone,
                type: 'text',
                text: { body: content },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`WhatsApp API error: ${error}`);
    }

    const result = await response.json();
    return result.messages?.[0]?.id || null;
}

async function sendEmail(to: string, content: string): Promise<string> {
    // TODO: Implement email sending (SendGrid, Resend, etc.)
    console.log(`[email] Would send to ${to}: ${content.slice(0, 50)}...`);
    return `email_${Date.now()}`;
}

async function sendSlack(channelId: string, content: string): Promise<string> {
    const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

    if (!SLACK_BOT_TOKEN) {
        throw new Error('Slack API not configured');
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({
            channel: channelId,
            text: content,
        }),
    });

    const result = await response.json();

    if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
    }

    return result.ts;
}

async function sendTelegram(chatId: string, content: string): Promise<string> {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!TELEGRAM_BOT_TOKEN) {
        throw new Error('Telegram API not configured');
    }

    const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: content,
            }),
        }
    );

    const result = await response.json();

    if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
    }

    return String(result.result.message_id);
}
