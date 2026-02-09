/**
 * Step 1 — Conversation Intelligence (LLM task)
 *
 * Analyzes incoming message to extract:
 * - AI summary of the conversation
 * - Intent classification
 * - Urgency level
 * - Entities (budget, timeline, deliverables, etc.)
 * - Suggested actions
 * - Lead candidate score
 */

import { ConversationIntelligence, MessageHistoryItem, Channel } from '../types';

interface ConversationIntelligenceInput {
    messageContent: string;
    channel: Channel;
    clientName: string;
    conversationHistory: MessageHistoryItem[];
}

const SYSTEM_PROMPT = `You are an AI assistant for a freelancer. Analyze incoming client messages to extract actionable intelligence.

Your task is to analyze the message and return a JSON object with:
1. aiSummary: A concise 1-2 sentence summary of what the client wants/needs
2. intent: One of: project_inquiry, payment_query, scope_clarification, follow_up, scheduling, casual_chat, introduction, complaint, unknown
3. urgency: high (needs response within hours), medium (within 24h), low (no rush)
4. entities: Extract any mentioned budget, timeline, deliverables, project type, contact info
5. suggestedActions: Array of recommended next steps
6. leadCandidateScore: 0-1 score based on project potential

Focus on signals that indicate a serious business opportunity vs casual conversation.`;

function buildUserPrompt(input: ConversationIntelligenceInput): string {
    const historyContext = input.conversationHistory.length > 0
        ? `\n\nConversation history:\n${input.conversationHistory
            .slice(-5) // Last 5 messages for context
            .map(m => `${m.role}: ${m.content}`)
            .join('\n')}`
        : '';

    return `Client: ${input.clientName}
Channel: ${input.channel}
${historyContext}

New message:
"${input.messageContent}"

Analyze this message and return the intelligence JSON.`;
}

export async function runConversationIntelligence(
    input: ConversationIntelligenceInput
): Promise<ConversationIntelligence> {
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

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || [null, content];
    const parsed = JSON.parse(jsonMatch[1] || content);

    return {
        aiSummary: parsed.aiSummary || 'Unable to summarize',
        intent: parsed.intent || 'unknown',
        urgency: parsed.urgency || 'medium',
        entities: parsed.entities || {},
        suggestedActions: parsed.suggestedActions || [],
        leadCandidateScore: parsed.leadCandidateScore || 0,
    };
}
