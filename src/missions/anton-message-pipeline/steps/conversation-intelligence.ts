/**
 * Step 1 — Conversation Intelligence (LLM task)
 *
 * V2: Updated system prompt with project_signals output.
 *
 * Analyzes incoming message to extract:
 * - Summary of the conversation
 * - Intent classification
 * - Urgency level (0.0 to 1.0)
 * - Entities (budget, timeline, deliverables, dates, payment terms)
 * - Suggested actions
 * - Lead candidate score
 * - Project signals (new project detection, stage change)
 */

import { ConversationIntelligence, MessageHistoryItem, Channel } from '../types';

interface ConversationIntelligenceInput {
    messageContent: string;
    channel: Channel;
    clientName: string;
    conversationHistory: MessageHistoryItem[];
    clientContext?: string;
}

const SYSTEM_PROMPT = `You are Anton's conversation intelligence engine for freelancer businesses.

INPUT: A conversation thread between a freelancer and their client, plus client context if available.

PRODUCE this exact JSON:
{
  "summary": "One-line summary of the latest message/exchange",
  "intent": "project_inquiry | payment_query | scope_clarification | follow_up | scheduling | feedback | casual_chat | spam",
  "urgency": 0.0 to 1.0,
  "entities": {
    "budget": {"amount": number or null, "currency": "USD"},
    "timeline": "description or null",
    "deliverables": ["list"] or [],
    "dates": ["YYYY-MM-DD"] or [],
    "payment_terms": "string or null"
  },
  "suggested_actions": ["ranked list of: create_lead, draft_proposal, ask_clarifying_question, create_project, send_invoice, schedule_followup, no_action"],
  "project_signals": {
    "is_new_project": boolean,
    "stage_change_detected": "stage name or null"
  }
}

RULES:
- Never invent budgets, timelines, or deliverables. If missing, set null.
- If critical info is missing, put ask_clarifying_question first in suggested_actions.
- Urgency > 0.7 requires explicit deadline or payment language.
- Never mention AI or Anton in any output.`;

function buildUserPrompt(input: ConversationIntelligenceInput): string {
    const historyContext = input.conversationHistory.length > 0
        ? `\n\nConversation history:\n${input.conversationHistory
            .slice(-5)
            .map(m => `${m.role}: ${m.content}`)
            .join('\n')}`
        : '';

    const clientContext = input.clientContext
        ? `\nClient context: ${input.clientContext}`
        : '';

    return `Client: ${input.clientName}
Channel: ${input.channel}${clientContext}
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

    // Map V2 LLM output keys to internal interface
    return {
        aiSummary: parsed.summary || parsed.aiSummary || 'Unable to summarize',
        intent: parsed.intent || 'unknown',
        urgency: typeof parsed.urgency === 'number' ? parsed.urgency : 0.5,
        entities: {
            budget: parsed.entities?.budget || undefined,
            timeline: parsed.entities?.timeline || undefined,
            deliverables: parsed.entities?.deliverables || [],
            dates: parsed.entities?.dates || [],
            paymentTerms: parsed.entities?.payment_terms || undefined,
        },
        suggestedActions: (parsed.suggested_actions || parsed.suggestedActions || []).map(
            (a: string) => a === 'no_action' ? 'none' : a
        ),
        leadCandidateScore: parsed.leadCandidateScore || 0,
        projectSignals: {
            isNewProject: parsed.project_signals?.is_new_project ?? false,
            stageChangeDetected: parsed.project_signals?.stage_change_detected ?? null,
        },
    };
}
