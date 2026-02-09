import { SupabaseClient } from '@supabase/supabase-js';
import { Channel } from '@/lib/types';

// Re-export Channel for use by step modules
export type { Channel };

export interface MissionContext {
    userId: string;
    supabase: SupabaseClient;
    input: {
        message: {
            id: string;
            content: string;
            direction: 'incoming' | 'outgoing';
            createdAt: string;
        };
        conversation: {
            id: string;
            channel: Channel;
            externalThreadId: string;
        };
        client: {
            id: string;
            name: string;
            phone?: string;
            email?: string;
            conversationCount: number;
        };
        conversationHistory?: MessageHistoryItem[];
    };
}

export interface MessageHistoryItem {
    role: 'client' | 'freelancer';
    content: string;
    timestamp: string;
}

export interface StepResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

export interface MissionDefinition {
    name: string;
    trigger: string;
    version: string;
    execute: (context: MissionContext) => Promise<StepResult>;
}

// Step 1 outputs
export interface ConversationIntelligence {
    aiSummary: string;
    intent: Intent;
    urgency: 'high' | 'medium' | 'low';
    entities: ExtractedEntities;
    suggestedActions: SuggestedAction[];
    leadCandidateScore: number;
}

export type Intent =
    | 'project_inquiry'
    | 'payment_query'
    | 'scope_clarification'
    | 'follow_up'
    | 'scheduling'
    | 'casual_chat'
    | 'introduction'
    | 'complaint'
    | 'unknown';

export interface ExtractedEntities {
    budget?: { amount: number; currency: string };
    timeline?: { startDate?: string; deadline?: string; duration?: string };
    deliverables?: string[];
    projectType?: string;
    contactInfo?: { email?: string; phone?: string };
}

export type SuggestedAction =
    | 'create_lead'
    | 'draft_proposal'
    | 'ask_clarifying_question'
    | 'schedule_call'
    | 'send_invoice'
    | 'escalate'
    | 'none';

// Step 2 outputs
export type LeadPriority = 'HOT' | 'WARM' | 'COLD';

export interface LeadScoringResult {
    score: number;
    priority: LeadPriority;
    signals: LeadSignals;
}

export interface LeadSignals {
    budgetPresent: boolean;
    timelinePresent: boolean;
    intentIsProjectInquiry: boolean;
    deliverablesDefiend: boolean;
    urgencyScore: number;
    messageLengthBonus: boolean;
    isRepeatClient: boolean;
}

// Step 4 outputs
export interface GeneratedReply {
    shortReply: string;
    detailedReply: string;
    confidence: number;
}
