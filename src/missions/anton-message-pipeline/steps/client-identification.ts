/**
 * Step 0 — Client Identification
 *
 * Runs BEFORE conversation intelligence. Given a message + sender metadata,
 * identifies or creates a client record and links the conversation.
 *
 * Logic:
 * 1. Extract sender name, company, email, phone from message metadata + content
 * 2. Search clients table for matches (fuzzy on name + exact on email/phone)
 * 3. If match found → link conversation to existing client, update last_interaction_at
 * 4. If no match → create new client record, link conversation
 * 5. Return client_id for downstream missions
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Channel } from '../types';

interface ClientIdentificationInput {
    supabase: SupabaseClient;
    userId: string;
    messageContent: string;
    senderName?: string;
    senderEmail?: string;
    senderPhone?: string;
    channel: Channel;
    conversationId: string;
}

interface ExtractedIdentity {
    name: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    confidence: number;
}

export interface ClientIdentificationResult {
    clientId: string;
    isNewClient: boolean;
    clientName: string;
}

const SYSTEM_PROMPT = `You extract client identity from freelancer conversations.

INPUT: Message content + sender metadata (email, phone, display name if available).

PRODUCE this JSON:
{
  "name": "Full name of the client",
  "company": "Company name if mentioned or inferable, else null",
  "email": "Email if present, else null",
  "phone": "Phone if present, else null",
  "role": "Job title/role if mentioned, else null",
  "confidence": 0.0 to 1.0
}

RULES:
- Extract from both message content and metadata.
- If the sender name is just a phone number, set name to null.
- Never invent details. Only extract what is explicitly stated or strongly implied.`;

async function extractIdentityWithLLM(
    messageContent: string,
    senderName?: string,
    senderEmail?: string,
    senderPhone?: string
): Promise<ExtractedIdentity> {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
        // Fallback: use metadata directly without LLM extraction
        return {
            name: senderName || null,
            company: null,
            email: senderEmail || null,
            phone: senderPhone || null,
            role: null,
            confidence: 0.5,
        };
    }

    const userPrompt = `Sender metadata:
- Display name: ${senderName || 'Unknown'}
- Email: ${senderEmail || 'Not provided'}
- Phone: ${senderPhone || 'Not provided'}

Message content:
"${messageContent}"

Extract the client identity as JSON.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
        }),
    });

    if (!response.ok) {
        // Fallback on API error
        return {
            name: senderName || null,
            company: null,
            email: senderEmail || null,
            phone: senderPhone || null,
            role: null,
            confidence: 0.3,
        };
    }

    const result = await response.json();
    const content = result.content[0]?.text || '';

    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || [null, content];
    const parsed = JSON.parse(jsonMatch[1] || content);

    return {
        name: parsed.name || senderName || null,
        company: parsed.company || null,
        email: parsed.email || senderEmail || null,
        phone: parsed.phone || senderPhone || null,
        role: parsed.role || null,
        confidence: parsed.confidence ?? 0.5,
    };
}

export async function identifyClient(
    input: ClientIdentificationInput
): Promise<ClientIdentificationResult> {
    const { supabase, userId, messageContent, senderName, senderEmail, senderPhone, channel, conversationId } = input;

    // 1. Extract identity from message + metadata
    const identity = await extractIdentityWithLLM(messageContent, senderName, senderEmail, senderPhone);

    // 2. Search for existing client (exact match on email or phone)
    let existingClient = null;

    if (identity.email) {
        const { data } = await supabase
            .from('clients')
            .select('id, name, channels')
            .eq('user_id', userId)
            .eq('email', identity.email)
            .single();
        if (data) existingClient = data;
    }

    if (!existingClient && identity.phone) {
        const { data } = await supabase
            .from('clients')
            .select('id, name, channels')
            .eq('user_id', userId)
            .eq('phone', identity.phone)
            .single();
        if (data) existingClient = data;
    }

    // 3. Fuzzy match on name if no exact match
    if (!existingClient && identity.name) {
        const { data } = await supabase
            .from('clients')
            .select('id, name, channels')
            .eq('user_id', userId)
            .ilike('name', identity.name)
            .single();
        if (data) existingClient = data;
    }

    let clientId: string;
    let isNewClient: boolean;
    let clientName: string;

    if (existingClient) {
        // 4a. Existing client — update last_interaction_at and merge channel info
        clientId = existingClient.id;
        clientName = existingClient.name;
        isNewClient = false;

        const existingChannels: Array<{ type: string; handle: string }> = existingClient.channels || [];
        const handle = identity.phone || identity.email || '';
        const channelExists = existingChannels.some(
            (c: { type: string; handle: string }) => c.type === channel && c.handle === handle
        );

        const updatedChannels = channelExists
            ? existingChannels
            : [...existingChannels, { type: channel, handle }];

        await supabase
            .from('clients')
            .update({
                last_interaction_at: new Date().toISOString(),
                channels: updatedChannels,
                ...(identity.company && { company: identity.company }),
                updated_at: new Date().toISOString(),
            })
            .eq('id', clientId);
    } else {
        // 4b. New client — create record
        clientName = identity.name || senderName || 'Unknown';
        isNewClient = true;

        const handle = identity.phone || identity.email || '';

        const { data: newClient, error } = await supabase
            .from('clients')
            .insert({
                user_id: userId,
                name: clientName,
                company: identity.company,
                email: identity.email,
                phone: identity.phone,
                channels: handle ? [{ type: channel, handle }] : [],
                last_interaction_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (error || !newClient) {
            throw new Error(`Failed to create client: ${error?.message}`);
        }

        clientId = newClient.id;
    }

    // 5. Link conversation to client
    await supabase
        .from('conversations')
        .update({ client_id: clientId })
        .eq('id', conversationId);

    return { clientId, isNewClient, clientName };
}
