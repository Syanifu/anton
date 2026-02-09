/**
 * Step 4 — Generate Reply (LLM task)
 *
 * If intent != casual_chat, generate short_reply + detailed_reply.
 * Stores the draft in the drafts table.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ConversationIntelligence, GeneratedReply, Channel } from '../types';

interface GenerateReplyInput {
    supabase: SupabaseClient;
    userId: string;
    conversationId: string;
    clientName: string;
    channel: Channel;
    messageContent: string;
    intelligence: ConversationIntelligence;
}

const SYSTEM_PROMPT = `You are a professional freelancer's AI assistant. Generate reply drafts for client messages.

For each message, create two versions:
1. short_reply: A brief, casual response (1-2 sentences, conversational)
2. detailed_reply: A more thorough response with all relevant details

Guidelines:
- Match the client's tone and formality level
- Be helpful and professional
- Include specific next steps when appropriate
- For project inquiries: acknowledge interest, ask clarifying questions if needed
- For payment queries: be clear and direct about amounts/timelines
- For scheduling: propose specific times when possible
- Avoid being overly formal or robotic

Return a JSON object with: shortReply, detailedReply, confidence (0-1)`;

function buildUserPrompt(input: GenerateReplyInput): string {
    const { clientName, channel, messageContent, intelligence } = input;

    return `Client: ${clientName}
Channel: ${channel}
Intent detected: ${intelligence.intent}
Urgency: ${intelligence.urgency}
AI Summary: ${intelligence.aiSummary}

Client's message:
"${messageContent}"

${intelligence.entities.budget ? `Budget mentioned: ${JSON.stringify(intelligence.entities.budget)}` : ''}
${intelligence.entities.timeline ? `Timeline mentioned: ${JSON.stringify(intelligence.entities.timeline)}` : ''}
${intelligence.entities.deliverables ? `Deliverables: ${intelligence.entities.deliverables.join(', ')}` : ''}

Generate appropriate reply drafts.`;
}

async function callLLM(input: GenerateReplyInput): Promise<GeneratedReply> {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
        throw new Error('Missing ANTHROPIC_API_KEY');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: buildUserPrompt(input),
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || [null, content];
    const parsed = JSON.parse(jsonMatch[1] || content);

    return {
        shortReply: parsed.shortReply || parsed.short_reply || 'Thanks for reaching out!',
        detailedReply: parsed.detailedReply || parsed.detailed_reply || 'Thank you for your message. I will get back to you soon.',
        confidence: parsed.confidence || 0.7,
    };
}

export async function generateReply(input: GenerateReplyInput): Promise<string> {
    const { supabase, userId, conversationId, clientName, channel, intelligence } = input;

    // Generate replies using LLM
    const reply = await callLLM(input);

    // Store draft in database
    const { data, error } = await supabase
        .from('drafts')
        .insert({
            user_id: userId,
            conversation_id: conversationId,
            client_name: clientName,
            channel,
            short: reply.shortReply,
            detailed: reply.detailedReply,
            confidence: reply.confidence,
            intent: intelligence.intent,
            status: 'pending',
            created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

    if (error) {
        throw new Error(`Failed to create draft: ${error.message}`);
    }

    return data.id;
}
