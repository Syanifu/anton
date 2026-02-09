import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { NormalizedIncomingMessage, Channel } from '@/lib/types';

// WhatsApp webhook verification token (set in Meta dashboard)
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;

// Default user_id for incoming messages (single-tenant for now)
const DEFAULT_USER_ID = process.env.ANTON_USER_ID!;

// GET: Webhook verification
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WhatsApp webhook verified');
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST: Incoming message handler
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // WhatsApp Cloud API webhook payload structure
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        // Skip non-message events (status updates, etc.)
        if (!value?.messages?.[0]) {
            return NextResponse.json({ status: 'ignored' }, { status: 200 });
        }

        const message = value.messages[0];
        const contact = value.contacts?.[0];

        // Extract message details
        const senderPhone = message.from; // e.g., "1234567890"
        const messageText = extractMessageText(message);
        const messageId = message.id;
        const timestamp = message.timestamp; // Unix timestamp

        // Get sender name from contacts or use phone as fallback
        const clientName = contact?.profile?.name || formatPhoneAsName(senderPhone);

        // Normalize into Anton format
        const normalized: NormalizedIncomingMessage = {
            user_id: DEFAULT_USER_ID,
            client_identifier: senderPhone,
            client_name: clientName,
            message_text: messageText,
            channel: 'whatsapp' as Channel,
            external_thread_id: senderPhone, // WhatsApp uses phone number as thread ID
            external_message_id: messageId,
            timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        };

        // Process the message
        await processIncomingMessage(normalized);

        return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error) {
        console.error('WhatsApp webhook error:', error);
        // Return 200 to prevent WhatsApp from retrying
        return NextResponse.json({ status: 'error' }, { status: 200 });
    }
}

function extractMessageText(message: Record<string, unknown>): string {
    // Handle different message types
    if (message.type === 'text') {
        return (message.text as { body: string })?.body || '';
    }
    if (message.type === 'image') {
        return '[Image]';
    }
    if (message.type === 'audio') {
        return '[Audio message]';
    }
    if (message.type === 'video') {
        return '[Video]';
    }
    if (message.type === 'document') {
        return '[Document]';
    }
    if (message.type === 'location') {
        return '[Location]';
    }
    if (message.type === 'sticker') {
        return '[Sticker]';
    }
    return '[Unsupported message type]';
}

function formatPhoneAsName(phone: string): string {
    // Format phone number as readable name
    // e.g., "1234567890" -> "+1 (234) 567-890"
    if (phone.length >= 10) {
        const cleaned = phone.replace(/\D/g, '');
        return `+${cleaned.slice(0, -10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
    }
    return phone;
}

async function processIncomingMessage(msg: NormalizedIncomingMessage): Promise<void> {
    const supabase = getSupabase();

    // 1. Upsert client (match by phone)
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .upsert(
            {
                user_id: msg.user_id,
                phone: msg.client_identifier,
                name: msg.client_name,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: 'user_id,phone',
                ignoreDuplicates: false,
            }
        )
        .select('id')
        .single();

    if (clientError) {
        console.error('Error upserting client:', clientError);
        throw clientError;
    }

    const clientId = client.id;

    // 2. Upsert conversation (match by external_thread_id + channel)
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .upsert(
            {
                user_id: msg.user_id,
                client_id: clientId,
                channel: msg.channel,
                external_thread_id: msg.external_thread_id,
                last_message_at: msg.timestamp,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: 'user_id,channel,external_thread_id',
                ignoreDuplicates: false,
            }
        )
        .select('id')
        .single();

    if (convError) {
        console.error('Error upserting conversation:', convError);
        throw convError;
    }

    const conversationId = conversation.id;

    // 3. Insert message row (direction: 'incoming')
    const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        direction: 'incoming',
        content: msg.message_text,
        external_message_id: msg.external_message_id,
        created_at: msg.timestamp,
    });

    if (msgError) {
        console.error('Error inserting message:', msgError);
        throw msgError;
    }

    // 4. Update conversation.last_message_at (already done in upsert above)
    // The upsert handles this, but we can explicitly update if needed
    console.log(`Processed WhatsApp message from ${msg.client_name} (${msg.client_identifier})`);

    // Note: The message insert will trigger the Supabase trigger automatically
    // Do NOT call Antigravity directly from here
}
