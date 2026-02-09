import { AIAnalysis, AIReply } from './types';

export async function analyzeMessage(text: string): Promise<AIAnalysis> {
    // Mock AI Latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const lowerText = text.toLowerCase();

    if (lowerText.includes('invoice') || lowerText.includes('payment')) {
        return {
            summary: 'Client asking about payment/invoice',
            intent: 'payment_query',
            urgency: 'medium',
            entities: { topic: 'payment' },
            suggestedAction: 'send_invoice',
            leadScore: 0.1,
        };
    }

    if (lowerText.includes('call') || lowerText.includes('meeting')) {
        return {
            summary: 'Request to schedule a call',
            intent: 'scheduling',
            urgency: 'medium',
            entities: { topic: 'meeting' },
            suggestedAction: 'schedule_call',
            leadScore: 0.6,
        };
    }

    if (lowerText.includes('project') || lowerText.includes('work') || lowerText.includes('redesign')) {
        return {
            summary: 'New project opportunity',
            intent: 'project_inquiry',
            urgency: 'high',
            entities: { topic: 'project' },
            suggestedAction: 'create_lead',
            leadScore: 0.9,
        };
    }

    return {
        summary: 'General inquiry',
        intent: 'casual_chat',
        urgency: 'low',
        entities: {},
        suggestedAction: 'none',
        leadScore: 0.3,
    };
}

export async function generateReplies(text: string, clientName: string): Promise<AIReply> {
    // Mock AI Latency
    await new Promise((resolve) => setTimeout(resolve, 1200));

    return {
        short: 'Sure, let\'s chat.',
        detailed: `Hi ${clientName},\n\nThanks for reaching out! I'd love to discuss this further. When are you free for a quick call?\n\nBest,`,
        confidence: 0.85,
    };
}
